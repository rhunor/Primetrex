import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Withdrawal from "@/models/Withdrawal";
import { siteConfig } from "@/config/site";

// Compute next Friday date (WAT = UTC+1)
function nextFridayWAT(): Date {
  const now = new Date(Date.now() + 60 * 60 * 1000); // shift to WAT
  const day = now.getUTCDay(); // 0=Sun … 5=Fri … 6=Sat
  const daysUntilFriday = day <= 5 ? 5 - day : 6; // days until next Friday
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilFriday);
  next.setUTCHours(0, 0, 0, 0);
  return new Date(next.getTime() - 60 * 60 * 1000); // back to UTC
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Friday-only gate (WAT = UTC+1) ───────────────────────────────────────
    const nowWAT = new Date(Date.now() + 60 * 60 * 1000);
    const dayWAT = nowWAT.getUTCDay(); // 5 = Friday
    if (dayWAT !== 5) {
      const next = nextFridayWAT();
      const label = next.toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Africa/Lagos",
      });
      return NextResponse.json(
        {
          error: `Withdrawals can only be requested on Fridays. Next withdrawal window: ${label}.`,
          nextFriday: next.toISOString(),
        },
        { status: 403 }
      );
    }

    const userId = (session.user as unknown as Record<string, unknown>)
      .id as string;
    const body = await req.json();
    const { amount, bankName, bankCode, accountNumber, accountName } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount < siteConfig.minWithdrawal) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal is \u20a6${siteConfig.minWithdrawal.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    if (!bankName || !bankCode || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "Complete bank details are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Calculate available balance
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
    const pendingWithdrawals = withdrawals
      .filter((w) => w.status === "pending" || w.status === "processing")
      .reduce((sum, w) => sum + w.amount, 0);

    const available = totalEarned - totalWithdrawn - pendingWithdrawals;

    if (numAmount > available) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Block concurrent withdrawal requests — prevents race condition where two
    // simultaneous requests both see the same available balance before either is saved.
    const alreadyPending = await Withdrawal.findOne({
      userId,
      status: { $in: ["pending", "processing"] },
    });
    if (alreadyPending) {
      return NextResponse.json(
        {
          error:
            "You already have a withdrawal in progress. Please wait for it to complete before submitting another.",
        },
        { status: 409 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update cached bank details on user
    user.bankDetails = { bankName, bankCode, accountNumber, accountName };
    await user.save();

    // Create withdrawal record — admin manually processes payouts
    const withdrawal = await Withdrawal.create({
      userId,
      amount: numAmount,
      bankName,
      bankCode,
      accountNumber,
      accountName,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal._id.toString(),
        amount: withdrawal.amount,
        status: withdrawal.status,
        bankName: withdrawal.bankName,
        accountNumber: withdrawal.accountNumber,
        accountName: withdrawal.accountName,
        rejectionReason: null,
        date: withdrawal.createdAt,
        processedAt: null,
      },
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: "Withdrawal request failed" },
      { status: 500 }
    );
  }
}
