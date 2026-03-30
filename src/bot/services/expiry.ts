import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import User from "@/models/User";
import Plan from "@/models/Plan";
import { removeUserFromChannel } from "./invite";
import { bot } from "@/bot/index";
import { sendSubscriptionExpiryReminderEmail } from "@/lib/email";

// Legacy channel — left untouched, bot no longer manages membership here
const LEGACY_CHANNEL_ID = "-1003699209692";

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

    if (sub.channelId !== LEGACY_CHANNEL_ID) {
      try {
        await removeUserFromChannel(sub.channelId, sub.userId);
      } catch (err: unknown) {
        const description =
          err && typeof err === "object" && "description" in err
            ? String((err as { description: string }).description)
            : "";
        if (!description.includes("PARTICIPANT_ID_INVALID") && !description.includes("USER_NOT_PARTICIPANT")) {
          console.error(`Failed to remove user ${sub.userId}:`, err);
        }
      }
    }

    const plan = sub.planId as unknown as InstanceType<typeof Plan>;
    const channelName = plan?.channelName || "the channel";

    // Telegram notification
    try {
      await bot.api.sendMessage(
        Number(sub.userId),
        `\u23F0 Your subscription to <b>${channelName}</b> has expired.\n\n` +
          `Tap \u{1F504} Renew to continue access.`,
        { parse_mode: "HTML" }
      );
    } catch {
      // User may have blocked bot
    }

    // Email notification — look up web user by Telegram ID
    const webUser = await User.findOne({ telegramId: sub.userId });
    if (webUser?.email && webUser.firstName) {
      sendSubscriptionExpiryReminderEmail({
        email: webUser.email,
        firstName: webUser.firstName,
        channelName,
        daysLeft: 0,
        expiryDate: sub.expiryDate,
      }).catch(() => {});
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
    const channelName = plan?.channelName || "the channel";

    // Telegram notification
    try {
      await bot.api.sendMessage(
        Number(sub.userId),
        `\u23F3 Your subscription to <b>${channelName}</b> expires in <b>${daysLeft} day(s)</b>.\n\n` +
          `Tap \u{1F504} Renew to avoid losing access.`,
        { parse_mode: "HTML" }
      );
    } catch {
      // Silent fail
    }

    // Email notification — look up web user by Telegram ID
    const webUser = await User.findOne({ telegramId: sub.userId });
    if (webUser?.email && webUser.firstName) {
      sendSubscriptionExpiryReminderEmail({
        email: webUser.email,
        firstName: webUser.firstName,
        channelName,
        daysLeft,
        expiryDate: sub.expiryDate,
      }).catch(() => {});
    }

    reminderCount++;
  }

  return { expired: expiredCount, reminders: reminderCount };
}

/**
 * One-time cleanup: remove all expired/non-active subscribers from the channel.
 * Safe to run multiple times (idempotent).
 */
export async function cleanupExpiredFromChannel(): Promise<{
  removed: number;
  failed: number;
}> {
  await dbConnect();

  const expiredSubs = await BotSubscriber.find({ status: { $ne: "active" } });

  let removed = 0;
  let failed = 0;

  for (const sub of expiredSubs) {
    if (sub.channelId === LEGACY_CHANNEL_ID) continue;
    try {
      await removeUserFromChannel(sub.channelId, sub.userId);
      removed++;
    } catch (err: unknown) {
      const description =
        err && typeof err === "object" && "description" in err
          ? String((err as { description: string }).description)
          : "";
      if (description.includes("PARTICIPANT_ID_INVALID") || description.includes("USER_NOT_PARTICIPANT")) {
        removed++;
      } else {
        console.error(`Failed to remove user ${sub.userId} from channel ${sub.channelId}:`, err);
        failed++;
      }
    }
  }

  return { removed, failed };
}
