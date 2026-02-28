import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Withdrawal from "@/models/Withdrawal";
import User from "@/models/User";
import { notifyWithdrawalUpdate } from "@/lib/notifications";
import { sendMessage } from "@/lib/telegram";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user as unknown as Record<string, unknown>).role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason } = body;

    if (!["mark_paid", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await dbConnect();

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    if (withdrawal.status === "completed" || withdrawal.status === "rejected") {
      return NextResponse.json(
        { error: "Withdrawal already finalised" },
        { status: 409 }
      );
    }

    if (action === "mark_paid") {
      withdrawal.status = "completed";
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      notifyWithdrawalUpdate(withdrawal.userId, "completed", withdrawal.amount).catch(
        () => {}
      );

      const user = await User.findById(withdrawal.userId);
      if (user?.telegramId) {
        sendMessage(
          parseInt(user.telegramId),
          `<b>Withdrawal Completed!</b>\n\n` +
            `\u20a6${withdrawal.amount.toLocaleString()} has been sent to your bank account.\n` +
            `Bank: ${withdrawal.bankName}\n` +
            `Account: ${withdrawal.accountNumber}`
        ).catch(() => {});
      }
    } else {
      // reject
      if (!rejectionReason?.trim()) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }
      withdrawal.status = "rejected";
      withdrawal.rejectionReason = rejectionReason.trim();
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      notifyWithdrawalUpdate(
        withdrawal.userId,
        "failed",
        withdrawal.amount,
        rejectionReason.trim()
      ).catch(() => {});

      const user = await User.findById(withdrawal.userId);
      if (user?.telegramId) {
        sendMessage(
          parseInt(user.telegramId),
          `<b>Withdrawal Rejected</b>\n\n` +
            `Your withdrawal of \u20a6${withdrawal.amount.toLocaleString()} was not processed.\n` +
            `Reason: ${rejectionReason.trim()}\n\n` +
            `Please contact support if you have questions.`
        ).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, status: withdrawal.status });
  } catch (error) {
    console.error("Admin withdrawal action error:", error);
    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }
}
