import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";
import { removeUserFromChannel } from "./invite";
import { bot } from "@/bot/index";

/**
 * Check for expired subscriptions and send reminders.
 * Called from cron job endpoint.
 */
export async function checkExpiredSubscriptions(): Promise<{
  expired: number;
  reminders: number;
}> {
  await dbConnect();

  const now = new Date();
  let expiredCount = 0;
  let reminderCount = 0;

  // Find expired active subscriptions
  const expired = await BotSubscriber.find({
    status: "active",
    expiryDate: { $lte: now },
  }).populate("planId");

  for (const sub of expired) {
    sub.status = "expired";
    await sub.save();

    await removeUserFromChannel(sub.channelId, sub.userId);

    const plan = sub.planId as unknown as InstanceType<typeof Plan>;
    try {
      await bot.api.sendMessage(
        Number(sub.userId),
        `\u23F0 Your subscription to <b>${plan?.channelName || "the channel"}</b> has expired.\n\n` +
          `Tap \u{1F504} Renew to continue access.`,
        { parse_mode: "HTML" }
      );
    } catch {
      // User may have blocked bot
    }

    expiredCount++;
  }

  // Send reminders for subscriptions expiring in 3 days
  const threeDaysFromNow = new Date(
    now.getTime() + 3 * 24 * 60 * 60 * 1000
  );
  const soonExpiring = await BotSubscriber.find({
    status: "active",
    expiryDate: { $gte: now, $lte: threeDaysFromNow },
  }).populate("planId");

  for (const sub of soonExpiring) {
    const daysLeft = Math.ceil(
      (sub.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const plan = sub.planId as unknown as InstanceType<typeof Plan>;
    try {
      await bot.api.sendMessage(
        Number(sub.userId),
        `\u23F3 Your subscription to <b>${plan?.channelName || "the channel"}</b> expires in <b>${daysLeft} day(s)</b>.\n\n` +
          `Tap \u{1F504} Renew to avoid losing access.`,
        { parse_mode: "HTML" }
      );
    } catch {
      // Silent fail
    }

    reminderCount++;
  }

  return { expired: expiredCount, reminders: reminderCount };
}
