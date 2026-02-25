import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "PrimetrexBot";
    const botLink = `https://t.me/${botUsername}?start=link_${user.referralCode}`;

    if (!user.telegramLinked || !user.telegramId) {
      return NextResponse.json({ telegramLinked: false, botLink });
    }

    const subscriber = await BotSubscriber.findOne({
      userId: user.telegramId,
    }).sort({ createdAt: -1 });

    const plan = await Plan.findOne({ isActive: true });

    const now = Date.now();
    const subscription = subscriber
      ? {
          status: subscriber.status,
          expiryDate: subscriber.expiryDate,
          daysLeft: Math.max(
            0,
            Math.ceil((subscriber.expiryDate.getTime() - now) / 86400000)
          ),
        }
      : null;

    return NextResponse.json({
      telegramLinked: true,
      botLink,
      subscription,
      plan: plan
        ? { price: plan.price, renewalPrice: plan.renewalPrice }
        : null,
    });
  } catch (error) {
    console.error("[bot-subscription/status] Error:", error);
    return NextResponse.json(
      { error: "Failed to load subscription status." },
      { status: 500 }
    );
  }
}
