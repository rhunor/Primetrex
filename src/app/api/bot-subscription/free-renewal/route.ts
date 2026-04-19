import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Plan from "@/models/Plan";
import BotSubscriber from "@/models/BotSubscriber";
import { generateMultiChannelInvites, sendMultiChannelInviteDM } from "@/bot/services/invite";
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

    // Use plan.channels array (multi-channel) — never fall back to legacy plan.channelId
    const channels = plan.channels?.length ? plan.channels : [];
    if (channels.length === 0) {
      console.error("[free-renewal] No channels configured on active plan.");
      return NextResponse.json({ error: "No channels configured." }, { status: 500 });
    }

    const now = new Date();
    const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;

    for (const channel of channels) {
      const existing = await BotSubscriber.findOne({
        userId: user.telegramId,
        channelId: channel.channelId,
        status: "active",
      });

      if (existing) {
        existing.expiryDate = new Date(existing.expiryDate.getTime() + durationMs);
        await existing.save();
      } else {
        await BotSubscriber.create({
          userId: user.telegramId,
          planId: plan._id,
          channelId: channel.channelId,
          startDate: now,
          expiryDate: new Date(now.getTime() + durationMs),
          status: "active",
          addedBy: "coupon",
        });
      }
    }

    // Mark coupon as used
    if (couponCode) {
      await applyCouponUsage(couponCode, session.user.id);
    }

    // Send invite links for all channels via Telegram DM
    try {
      const invites = await generateMultiChannelInvites(channels);
      await sendMultiChannelInviteDM(user.telegramId, invites);
    } catch {
      // Don't fail if DM fails
    }

    return NextResponse.json({ success: true, message: "Subscription activated for free." });
  } catch (error) {
    console.error("[free-renewal] Error:", error);
    return NextResponse.json({ error: "Failed to activate subscription." }, { status: 500 });
  }
}
