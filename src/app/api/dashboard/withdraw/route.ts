import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Withdrawal from "@/models/Withdrawal";
import {
  createTransferRecipient,
  initiateTransfer,
  generateTransferReference,
} from "@/lib/paystack";
import { siteConfig } from "@/config/site";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as unknown as Record<string, unknown>)
      .id as string;
    const body = await req.json();
    const { amount, bankName, bankCode, accountNumber, accountName } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount < siteConfig.minWithdrawal) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal is ₦${siteConfig.minWithdrawal.toLocaleString()}`,
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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get or create Paystack transfer recipient
    let recipientCode = user.paystackRecipientCode;

    // Check if bank details changed — need new recipient
    const bankChanged =
      !recipientCode ||
      user.bankDetails?.bankCode !== bankCode ||
      user.bankDetails?.accountNumber !== accountNumber;

    if (bankChanged) {
      const recipientResult = await createTransferRecipient({
        name: accountName,
        accountNumber,
        bankCode,
      });
      recipientCode = recipientResult.data.recipient_code;

      // Cache the recipient code and update bank details
      user.paystackRecipientCode = recipientCode;
      user.bankDetails = { bankName, bankCode, accountNumber, accountName };
      await user.save();
    }

    // Create withdrawal record
    const withdrawal = await Withdrawal.create({
      userId,
      amount: numAmount,
      bankName,
      bankCode,
      accountNumber,
      accountName,
      status: "processing",
    });

    // Initiate Paystack transfer
    const transferRef = generateTransferReference(
      withdrawal._id.toString()
    );

    try {
      const transferResult = await initiateTransfer({
        amount: numAmount,
        recipientCode: recipientCode!,
        reason: `Primetrex affiliate withdrawal #${withdrawal._id}`,
        reference: transferRef,
      });

      // Update withdrawal with transfer details
      withdrawal.transferCode = transferResult.data.transfer_code;
      withdrawal.paystackReference = transferRef;
      await withdrawal.save();
    } catch (transferError) {
      // Transfer initiation failed — mark withdrawal as failed
      withdrawal.status = "failed";
      withdrawal.rejectionReason =
        transferError instanceof Error
          ? transferError.message
          : "Transfer initiation failed";
      await withdrawal.save();

      return NextResponse.json(
        { error: "Failed to process withdrawal. Please try again later." },
        { status: 500 }
      );
    }

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
