import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentByRef, verifyPaymentById, FlwVerifyResponse } from "@/lib/flutterwave-web";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Referral from "@/models/Referral";
import Transaction from "@/models/Transaction";
import { sendWelcomeEmail } from "@/lib/email";
import {
  notifyWelcome,
  notifyCommissionEarned,
  notifyReferralSignup,
} from "@/lib/notifications";
import { siteConfig } from "@/config/site";

export async function GET(req: NextRequest) {
  try {
    const txRef = req.nextUrl.searchParams.get("tx_ref");
    const transactionId = req.nextUrl.searchParams.get("transaction_id");

    if (!txRef && !transactionId) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    // Verify with Flutterwave — try transaction_id first (most reliable), then tx_ref
    let verification: FlwVerifyResponse | null = null;
    let verifyError: string | null = null;

    if (transactionId) {
      try {
        verification = await verifyPaymentById(transactionId);
      } catch (err) {
        verifyError = err instanceof Error ? err.message : String(err);
        console.error("[verify] verifyPaymentById failed:", verifyError);
      }
    }

    // Fall back to tx_ref if ID verification failed or wasn't attempted
    if (
      txRef &&
      (!verification || verification.status !== "success" || verification.data?.status !== "successful")
    ) {
      try {
        verification = await verifyPaymentByRef(txRef);
        verifyError = null; // clear previous error if this succeeds
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[verify] verifyPaymentByRef failed:", msg);
        if (!verifyError) verifyError = msg;
      }
    }

    if (
      !verification ||
      verification.status !== "success" ||
      verification.data?.status !== "successful"
    ) {
      console.error("[verify] Final verification status:", {
        txRef,
        transactionId,
        verifyStatus: verification?.status,
        dataStatus: verification?.data?.status,
        verifyError,
      });
      return NextResponse.json(
        {
          error: "Payment verification failed",
          verified: false,
          status: verification?.data?.status,
        },
        { status: 400 }
      );
    }

    const { customer, amount } = verification.data;
    await dbConnect();

    // Look up user by txRef stored during payment initialization — more reliable than
    // customer.email because Flutterwave checkout allows customers to change their email.
    let user = txRef ? await User.findOne({ signupPaymentRef: txRef }) : null;

    // Fallback to customer.email for any records that predate the txRef approach
    if (!user && customer.email) {
      user = await User.findOne({ email: customer.email.toLowerCase() });
    }

    if (!user) {
      console.error("[verify] User not found. txRef:", txRef, "customer.email:", customer.email);
      return NextResponse.json(
        { error: "User not found for this payment", verified: false },
        { status: 404 }
      );
    }

    if (!user.hasPaidSignup) {
      user.hasPaidSignup = true;
      user.isActive = true;
      user.signupPaymentRef = txRef || transactionId;
      await user.save();

      // Record signup transaction if not already done
      const ref = txRef || transactionId!;
      const existingTx = await Transaction.findOne({ paymentReference: ref, type: "subscription" });
      if (!existingTx) {
        await Transaction.create({
          userId: user._id,
          type: "subscription",
          amount,
          status: "completed",
          paymentReference: ref,
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

        // Generate commissions (idempotent — skip if already recorded)
        const existingCommission = await Transaction.findOne({
          paymentReference: ref,
          type: "commission",
        });

        if (!existingCommission) {
          const tier1Amount = amount * (siteConfig.commission.tier1Rate / 100);
          await Transaction.create({
            userId: user.referredBy,
            type: "commission",
            amount: tier1Amount,
            tier: 1,
            status: "completed",
            sourceUserId: user._id,
            paymentReference: ref,
            description: `Tier 1 commission from ${user.firstName} ${user.lastName} (signup)`,
          });

          notifyCommissionEarned(
            user.referredBy,
            tier1Amount,
            1,
            `${user.firstName} ${user.lastName}`
          ).catch(() => {});

          // Tier 2
          const tier1Referrer = await User.findById(user.referredBy);
          if (tier1Referrer?.referredBy) {
            const tier2Amount = amount * (siteConfig.commission.tier2Rate / 100);
            await Transaction.create({
              userId: tier1Referrer.referredBy,
              type: "commission",
              amount: tier2Amount,
              tier: 2,
              status: "completed",
              sourceUserId: user._id,
              paymentReference: `${ref}-t2`,
              description: `Tier 2 commission from ${user.firstName} ${user.lastName} (signup)`,
            });

            notifyCommissionEarned(
              tier1Referrer.referredBy,
              tier2Amount,
              2,
              `${user.firstName} ${user.lastName}`
            ).catch(() => {});
          }
        }
      }

      // Send welcome email and notification
      sendWelcomeEmail(user.email, user.firstName).catch(() => {});
      notifyWelcome(user._id, user.firstName).catch(() => {});
      if (user.referredBy) {
        notifyReferralSignup(
          user.referredBy,
          `${user.firstName} ${user.lastName}`
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      verified: true,
      message: "Payment verified successfully. Your account is now active.",
    });
  } catch (error) {
    console.error("[verify] Unexpected error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please contact support." },
      { status: 500 }
    );
  }
}
