import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Plan from "@/models/Plan";
import BotSubscriber from "@/models/BotSubscriber";
import { generateInviteLink, sendInviteDM } from "@/bot/services/invite";
import { applyCouponUsage } from "@/lib/coupon";

/**
 * Activates a subscription for free (100% coupon discount).
 * Skips Korapay entirely.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { couponCode } = await req.json();

  try {
    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user?.telegramId) {
      return NextResponse.json({ error: "Telegram account not linked." }, { status: 400 });
    }

    const plan = await Plan.findOne({ isActive: true });
    if (!plan) {
      return NextResponse.json({ error: "No active plan found." }, { status: 404 });
    }

    const now = new Date();
    const expiryDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const existing = await BotSubscriber.findOne({
      userId: user.telegramId,
      channelId: plan.channelId,
      status: "active",
    });

    if (existing) {
      // Extend subscription
      existing.expiryDate = new Date(
        existing.expiryDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
      );
      await existing.save();
    } else {
      // New subscription
      await BotSubscriber.create({
        userId: user.telegramId,
        planId: plan._id,
        channelId: plan.channelId,
        startDate: now,
        expiryDate,
        status: "active",
        addedBy: "coupon",
      });
    }

    // Mark coupon as used (track web user ID to prevent reuse)
    if (couponCode) {
      await applyCouponUsage(couponCode, session.user.id);
    }

    // Send invite link via Telegram DM
    try {
      const inviteLink = await generateInviteLink(plan.channelId);
      await sendInviteDM(user.telegramId, plan.channelName, inviteLink);
    } catch {
      // Don't fail if DM fails
    }

    return NextResponse.json({ success: true, message: "Subscription activated for free." });
  } catch (error) {
    console.error("[free-renewal] Error:", error);
    return NextResponse.json({ error: "Failed to activate subscription." }, { status: 500 });
  }
}
