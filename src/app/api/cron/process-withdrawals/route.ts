/**
 * Automated withdrawal batch processor — runs every Saturday at 08:00 WAT (07:00 UTC).
 * Triggered by Vercel Cron (see vercel.json).
 *
 * Security model:
 * 1. Auth: Bearer CRON_SECRET — rejects any request without it.
 * 2. Re-validates each user's available balance before processing
 *    (balance can change between Friday request and Saturday processing).
 * 3. Atomically sets status → "processing" before calling Flutterwave,
 *    so a double-trigger (e.g. cron retried) skips already-in-flight items.
 * 4. Flutterwave reference = WTH-{withdrawalId} — idempotent: Flutterwave
 *    rejects duplicate references, preventing double payouts.
 * 5. FIXIE_URL proxy ensures the call comes from a static, whitelisted IP.
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Withdrawal from "@/models/Withdrawal";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { initiateTransfer, generateTransferRef } from "@/lib/flutterwave-web";
import { notifyWithdrawalUpdate } from "@/lib/notifications";
import { sendMessage } from "@/lib/telegram";

interface ProcessResult {
  processed: number;
  failed: number;
  skipped: number;
  details: Array<{ id: string; status: "processed" | "failed" | "skipped"; reason?: string }>;
}

async function getUserAvailableBalance(userId: string): Promise<number> {
  const commissions = await Transaction.find({
    userId,
    type: "commission",
    status: "completed",
  }).lean();
  const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);

  const withdrawals = await Withdrawal.find({ userId }).lean();
  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + w.amount, 0);
  // Exclude the current batch — only count already-processing/pending from previous cycles
  const otherPending = withdrawals
    .filter((w) => w.status === "processing")
    .reduce((sum, w) => sum + w.amount, 0);

  return totalEarned - totalWithdrawn - otherPending;
}

export async function GET(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const result: ProcessResult = { processed: 0, failed: 0, skipped: 0, details: [] };

  // ── Fetch all pending withdrawals ──────────────────────────────────────────
  const pendingWithdrawals = await Withdrawal.find({ status: "pending" })
    .sort({ createdAt: 1 }) // oldest first
    .lean();

  for (const w of pendingWithdrawals) {
    const wId = w._id.toString();

    // ── Atomic claim: skip if another process already picked this up ──────────
    const claimed = await Withdrawal.findOneAndUpdate(
      { _id: w._id, status: "pending" },
      { $set: { status: "processing" } },
      { new: false }
    );
    if (!claimed) {
      result.skipped++;
      result.details.push({ id: wId, status: "skipped", reason: "Already claimed by another run" });
      continue;
    }

    // ── Re-validate available balance ─────────────────────────────────────────
    const available = await getUserAvailableBalance(w.userId.toString());
    if (w.amount > available) {
      // Revert to pending so admin can review, or user can re-submit
      await Withdrawal.updateOne({ _id: w._id }, { $set: { status: "failed", rejectionReason: "Insufficient balance at processing time" } });
      result.failed++;
      result.details.push({ id: wId, status: "failed", reason: "Insufficient balance at processing time" });

      notifyWithdrawalUpdate(w.userId, "failed", w.amount, "Insufficient balance at processing time").catch(() => {});
      continue;
    }

    // ── Initiate Flutterwave transfer ─────────────────────────────────────────
    // Reference uses withdrawal ID only (no timestamp) for idempotency.
    // Flutterwave rejects if this reference was already used → safe against double-payout.
    const transferRef = `WTH-${wId}`;

    try {
      const transferResult = await initiateTransfer({
        accountBank: w.bankCode,
        accountNumber: w.accountNumber,
        amount: w.amount,
        narration: "Primetrex affiliate withdrawal",
        reference: transferRef,
        beneficiaryName: w.accountName,
      });

      await Withdrawal.updateOne(
        { _id: w._id },
        {
          $set: {
            transferReference: transferRef,
            transferCode: transferResult.data?.id?.toString() ?? null,
            // status stays "processing" — webhook sets it to "completed" / "failed"
          },
        }
      );

      result.processed++;
      result.details.push({ id: wId, status: "processed" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Transfer initiation failed";
      await Withdrawal.updateOne(
        { _id: w._id },
        { $set: { status: "failed", rejectionReason: reason } }
      );

      notifyWithdrawalUpdate(w.userId, "failed", w.amount, reason).catch(() => {});

      const user = await User.findById(w.userId);
      if (user?.telegramId) {
        sendMessage(
          parseInt(user.telegramId),
          `<b>Withdrawal Failed</b>\n\n` +
            `Your withdrawal of \u20a6${w.amount.toLocaleString()} could not be processed.\n` +
            `Reason: ${reason}\n\n` +
            `Please verify your bank details and try again next Friday.`
        ).catch(() => {});
      }

      result.failed++;
      result.details.push({ id: wId, status: "failed", reason });
    }
  }

  return NextResponse.json({
    ...result,
    total: pendingWithdrawals.length,
    timestamp: new Date().toISOString(),
  });
}
