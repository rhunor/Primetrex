import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Plan from "@/models/Plan";
import BotSubscriber from "@/models/BotSubscriber";
import BotPayment from "@/models/BotPayment";
import { initializeCharge, generateBotTxRef } from "@/lib/korapay";
import { validateCoupon, applyCouponUsage } from "@/lib/coupon";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const couponCode: string | undefined = body?.couponCode;

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.telegramLinked || !user.telegramId) {
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || "PrimetrexBot";
      const botLink = `https://t.me/${botUsername}?start=link_${user.referralCode}`;
      return NextResponse.json(
        {
          error: "Please link your Telegram account first before subscribing.",
          botLink,
        },
        { status: 400 }
      );
    }

    const plan = await Plan.findOne({ isActive: true });
    if (!plan) {
      return NextResponse.json(
        { error: "No active subscription plan found. Please contact support." },
        { status: 404 }
      );
    }

    // Determine if this is a new subscription or renewal
    const activeSub = await BotSubscriber.findOne({
      userId: user.telegramId,
      status: "active",
    });
    const isRenewal = !!activeSub;
    let amount = isRenewal ? plan.renewalPrice : plan.price;

    // Apply coupon if provided
    let appliedCouponCode: string | undefined;
    let discountAmount = 0;

    if (couponCode) {
      const couponResult = await validateCoupon(couponCode, amount, session.user.id);
      if (!couponResult.valid) {
        return NextResponse.json({ error: couponResult.error }, { status: 400 });
      }
      discountAmount = couponResult.discountAmount;
      amount = couponResult.finalAmount;
      appliedCouponCode = couponCode.toUpperCase().trim();
    }

    const txRef = generateBotTxRef(isRenewal ? "renewal" : "new");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${appUrl}/dashboard/subscription?bot_paid=success&tx_ref=${txRef}`;

    // Create BotPayment record
    await BotPayment.create({
      userId: user.telegramId,
      planId: plan._id,
      amount,
      paymentRef: txRef,
      paymentType: isRenewal ? "renewal" : "new",
      status: "pending",
      webUserId: user._id,
      referralCode: null,
    });

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const narration = isRenewal
      ? "Primetrex Copy Trading Renewal"
      : "Primetrex Copy Trading Subscription";

    const paymentUrl = await initializeCharge({
      reference: txRef,
      amount,
      email: user.email,
      name: fullName,
      narration,
      redirectUrl,
      metadata: {
        type: isRenewal ? "bot-renewal" : "bot-subscription",
        webUserId: user._id.toString(),
        telegramId: user.telegramId,
        ...(appliedCouponCode ? { couponCode: appliedCouponCode, discountAmount } : {}),
      },
    });

    // Mark coupon as used now that payment is initialized
    if (appliedCouponCode) {
      await applyCouponUsage(appliedCouponCode, session.user.id);
    }

    return NextResponse.json({
      paymentUrl,
      txRef,
      type: isRenewal ? "renewal" : "new",
      amount,
      discountAmount,
    });
  } catch (error) {
    console.error("[bot-subscription/initialize] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment. Please try again." },
      { status: 500 }
    );
  }
}
