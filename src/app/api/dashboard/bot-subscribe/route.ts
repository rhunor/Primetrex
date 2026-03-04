import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Plan from "@/models/Plan";
import BotPayment from "@/models/BotPayment";
import BotSubscriber from "@/models/BotSubscriber";
import { initializePayment, generateBotTxRef } from "@/lib/flutterwave-web";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;
    await dbConnect();

    const user = await User.findById(userId).select("telegramId telegramLinked");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = await Plan.findOne({ isActive: true });
    if (!plan) {
      return NextResponse.json({ error: "No active plan found" }, { status: 404 });
    }

    // Check if this user already has a bot subscription (is it a renewal?)
    let isRenewal = false;
    if (user.telegramId) {
      const existing = await BotSubscriber.findOne({ userId: user.telegramId, status: "active" });
      isRenewal = !!existing;
    }

    return NextResponse.json({
      telegramLinked: user.telegramLinked,
      plan: {
        name: plan.name,
        channelName: plan.channelName,
        price: plan.price,
        renewalPrice: plan.renewalPrice,
        durationDays: plan.durationDays,
      },
      isRenewal,
    });
  } catch (error) {
    console.error("Bot subscribe GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.telegramLinked || !user.telegramId) {
      return NextResponse.json(
        { error: "Please link your Telegram account first." },
        { status: 400 }
      );
    }

    const plan = await Plan.findOne({ isActive: true });
    if (!plan) {
      return NextResponse.json({ error: "No active plan available." }, { status: 404 });
    }

    const txRef = generateBotTxRef("new");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${appUrl}/dashboard/bot-subscribe/success?tx_ref={tx_ref}`;

    await BotPayment.create({
      userId: user.telegramId,
      planId: plan._id,
      amount: plan.price,
      paymentRef: txRef,
      paymentType: "new",
      status: "pending",
      webUserId: user._id,
    });

    const paymentUrl = await initializePayment({
      txRef,
      amount: plan.price,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      description: `Primetrex Bot Subscription — ${plan.channelName}`,
      redirectUrl,
    });

    return NextResponse.json({ paymentUrl, txRef });
  } catch (error) {
    console.error("Bot subscribe POST error:", error);
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}
