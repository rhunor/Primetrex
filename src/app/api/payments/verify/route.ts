import { NextRequest, NextResponse } from "next/server";
import { verifyCharge } from "@/lib/korapay";
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
    // Korapay appends ?reference=YOUR_REFERENCE to the redirect URL
    const reference = req.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const verification = await verifyCharge(reference);

    if (
      !verification.status ||
      !verification.data ||
      verification.data.status !== "success"
    ) {
      console.error("[verify] Korapay verification failed:", {
        reference,
        status: verification.data?.status,
        message: verification.message,
      });
      return NextResponse.json(
        {
          error: "Payment verification failed",
          verified: false,
          status: verification.data?.status,
        },
        { status: 400 }
      );
    }

    const { customer, amount } = verification.data;
    await dbConnect();

    // Look up user by stored signupPaymentRef first (more reliable than email)
    let user = await User.findOne({ signupPaymentRef: reference });

    // Fallback to customer email
    if (!user && customer.email) {
      user = await User.findOne({ email: customer.email.toLowerCase() });
    }

    if (!user) {
      console.error("[verify] User not found. reference:", reference, "email:", customer.email);
      return NextResponse.json(
        { error: "User not found for this payment", verified: false },
        { status: 404 }
      );
    }

    if (!user.hasPaidSignup) {
      user.hasPaidSignup = true;
      user.isActive = true;
      user.signupPaymentRef = reference;
      await user.save();

      const existingTx = await Transaction.findOne({
        paymentReference: reference,
        type: "subscription",
      });
      if (!existingTx) {
        await Transaction.create({
          userId: user._id,
          type: "subscription",
          amount,
          status: "completed",
          paymentReference: reference,
          description: "Affiliate signup fee",
          metadata: { type: "signup" },
        });
      }

      if (user.referredBy) {
        await Referral.updateMany(
          { referredUserId: user._id },
          { status: "active" }
        );

        const existingCommission = await Transaction.findOne({
          paymentReference: reference,
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
            paymentReference: reference,
            description: `Tier 1 commission from ${user.firstName} ${user.lastName} (signup)`,
          });

          notifyCommissionEarned(
            user.referredBy,
            tier1Amount,
            1,
            `${user.firstName} ${user.lastName}`
          ).catch(() => {});

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
              paymentReference: `${reference}-t2`,
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
