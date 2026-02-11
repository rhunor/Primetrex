import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/paystack";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Referral from "@/models/Referral";
import Transaction from "@/models/Transaction";

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    // Verify with Paystack
    const verification = await verifyPayment(reference);

    if (!verification.status || verification.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed", verified: false },
        { status: 400 }
      );
    }

    const { customer, metadata, amount } = verification.data;

    await dbConnect();

    // Handle signup payment — activate user if webhook hasn't already
    if (metadata?.type === "signup") {
      const user = await User.findOne({ email: customer.email });

      if (user && !user.hasPaidSignup) {
        user.hasPaidSignup = true;
        user.isActive = true;
        user.signupPaymentRef = reference;
        await user.save();

        // Record the transaction if not already recorded
        const existingTx = await Transaction.findOne({ paymentReference: reference });
        if (!existingTx) {
          await Transaction.create({
            userId: user._id,
            type: "subscription",
            amount: amount / 100,
            status: "completed",
            paymentReference: reference,
            description: "Affiliate signup fee",
            metadata: { type: "signup" },
          });
        }

        // Activate referral records
        if (user.referredBy) {
          await Referral.updateMany(
            { referredUserId: user._id },
            { status: "active" }
          );
        }
      }

      return NextResponse.json({
        verified: true,
        message: "Payment verified successfully. Your account is now active.",
      });
    }

    return NextResponse.json({
      verified: true,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please contact support." },
      { status: 500 }
    );
  }
}
