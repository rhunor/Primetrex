import { bot } from "@/bot/index";
import { getAverisSubscriberModel } from "@/models/averis/AverisSubscriberModel";
import { getAverisUserModel } from "@/models/averis/AverisUserModel";

const GROUP_ID = process.env.AVERIS_TELEGRAM_GROUP_ID!;
const CHANNEL_ID = process.env.AVERIS_TELEGRAM_CHANNEL_ID || "";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateAverisInviteLink(): Promise<string> {
  const invite = await bot.api.createChatInviteLink(Number(GROUP_ID), {
    member_limit: 1,
  });
  return invite.invite_link;
}

export async function generateAverisChannelInviteLink(): Promise<string | null> {
  if (!CHANNEL_ID) return null;
  const invite = await bot.api.createChatInviteLink(Number(CHANNEL_ID), {
    member_limit: 1,
  });
  return invite.invite_link;
}

export async function removeFromAverisGroup(telegramId: string): Promise<void> {
  await bot.api.banChatMember(Number(GROUP_ID), Number(telegramId));
  await bot.api.unbanChatMember(Number(GROUP_ID), Number(telegramId));
}

/**
 * Called when a user clicks the bot deep link from the Averis Academy welcome email.
 * Links their Telegram ID to their Averis account and adds them to the group.
 */
export async function handleAverisJoin(
  telegramId: string,
  _telegramFirstName: string,
  referralCode: string
): Promise<{ success: boolean; message: string; inviteLink?: string }> {
  const AverisUser = await getAverisUserModel();
  const AverisSubscriber = await getAverisSubscriberModel();

  const user = await AverisUser.findOne({ referralCode });
  if (!user) {
    return { success: false, message: "No Averis Academy account found for this referral code. Please ensure you have registered and paid." };
  }

  if (!user.isActive) {
    return { success: false, message: "Your Averis Academy subscription is not active yet. Please complete your payment first." };
  }

  // If already linked to a different Telegram ID
  if (user.telegramLinked && user.telegramId && user.telegramId !== telegramId) {
    return { success: false, message: "This Averis Academy account is already linked to a different Telegram account." };
  }

  // Save Telegram ID to Averis User record
  await AverisUser.updateOne(
    { _id: user._id },
    { telegramId, telegramLinked: true }
  );

  const expiryDate = user.subscriptionExpiresAt ?? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

  // Create or update AverisSubscriber record
  const existing = await AverisSubscriber.findOne({ telegramId });
  if (existing) {
    existing.expiryDate = expiryDate;
    existing.status = "active";
    existing.removedAt = null;
    await existing.save();
  } else {
    await AverisSubscriber.create({
      telegramId,
      averisUserId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      groupId: GROUP_ID,
      expiryDate,
      status: "active",
      remindersSent: [],
    });
  }

  // Generate community group + announcement channel invite links and send DM
  try {
    const [groupLink, channelLink] = await Promise.all([
      generateAverisInviteLink(),
      generateAverisChannelInviteLink(),
    ]);

    const expiryStr = expiryDate.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

    let message =
      `✅ <b>Welcome to Averis Academy!</b>\n\n` +
      `Hi <b>${user.firstName}</b>! Your subscription has been confirmed.\n\n` +
      `\u{1F4AC} <b>Step 1 — Join the Community Group:</b>\n${groupLink}\n\n`;

    if (channelLink) {
      message +=
        `\u{1F4E2} <b>Step 2 — Join the Announcement Channel:</b>\n${channelLink}\n\n`;
    }

    message +=
      `⚠️ These links are single-use. Join both now before they expire!\n\n` +
      `Your subscription is active until <b>${expiryStr}</b>.`;

    await bot.api.sendMessage(Number(telegramId), message, { parse_mode: "HTML" });
    return { success: true, message: "Joined successfully.", inviteLink: groupLink };
  } catch {
    return { success: true, message: "Account linked but invite DM failed — please tap the button above to get your invite link." };
  }
}

/**
 * Called by cron — checks all active Averis subscribers and:
 * 1. Sends reminders at 30d, 15d, 7d, 3d, 1d before expiry
 * 2. Removes expired subscribers from the group
 */
export async function checkAverisExpiry(): Promise<{ expired: number; reminders: number }> {
  const AverisSubscriber = await getAverisSubscriberModel();
  const now = new Date();
  let expiredCount = 0;
  let reminderCount = 0;

  // Check reminder windows (in days before expiry)
  const reminderWindows = [
    { key: "30d", days: 30 },
    { key: "15d", days: 15 },
    { key: "7d", days: 7 },
    { key: "3d", days: 3 },
    { key: "1d", days: 1 },
  ];

  const allActive = await AverisSubscriber.find({ status: "active" });

  for (const sub of allActive) {
    const msLeft = sub.expiryDate.getTime() - now.getTime();
    const daysLeft = msLeft / (1000 * 60 * 60 * 24);

    // Handle expiry
    if (daysLeft <= 0) {
      sub.status = "expired";
      await sub.save();

      try {
        await removeFromAverisGroup(sub.telegramId);
        sub.removedAt = new Date();
        await sub.save();
      } catch (err: unknown) {
        const desc = err && typeof err === "object" && "description" in err ? String((err as { description: string }).description) : "";
        if (!desc.includes("PARTICIPANT_ID_INVALID") && !desc.includes("USER_NOT_PARTICIPANT")) {
          console.error(`[averis/expiry] Remove failed for telegramId=${sub.telegramId}:`, err);
        }
      }

      try {
        await bot.api.sendMessage(
          Number(sub.telegramId),
          `\u{1F534} <b>Averis Academy Subscription Expired</b>\n\n` +
            `Hi <b>${sub.firstName}</b>, your Averis Academy subscription has expired and you've been removed from the community group.\n\n` +
            `\u{1F504} Renew now for ₦30,000 to regain access and keep earning commissions.\n\n` +
            `Visit <a href="${process.env.AVERIS_APP_URL || "https://app.averisacademy.com"}/dashboard/subscription">your dashboard</a> to renew.`,
          { parse_mode: "HTML" }
        );
      } catch { /* user may have blocked the bot */ }

      expiredCount++;
      await sleep(300);
      continue;
    }

    // Send reminders
    for (const window of reminderWindows) {
      if (daysLeft <= window.days + 0.5 && daysLeft > window.days - 0.5 && !sub.remindersSent.includes(window.key)) {
        const roundedDays = Math.ceil(daysLeft);
        const expiryStr = sub.expiryDate.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

        try {
          await bot.api.sendMessage(
            Number(sub.telegramId),
            `⏳ <b>Averis Academy — ${roundedDays} day${roundedDays === 1 ? "" : "s"} left</b>\n\n` +
              `Hi <b>${sub.firstName}</b>! Your Averis Academy subscription expires on <b>${expiryStr}</b>.\n\n` +
              `Renew for ₦30,000 to keep your access and continue earning 50% commissions.\n\n` +
              `\u{1F4B3} <a href="${process.env.AVERIS_APP_URL || "https://app.averisacademy.com"}/dashboard/subscription">Renew Subscription →</a>`,
            { parse_mode: "HTML" }
          );
          sub.remindersSent.push(window.key);
          await sub.save();
          reminderCount++;
        } catch { /* user may have blocked the bot */ }

        await sleep(300);
        break;
      }
    }
  }

  return { expired: expiredCount, reminders: reminderCount };
}

/**
 * Get Averis subscription status for a Telegram user.
 */
export async function getAverisStatus(telegramId: string): Promise<{
  isSubscribed: boolean;
  daysLeft?: number;
  expiryDate?: Date;
  firstName?: string;
} | null> {
  const AverisSubscriber = await getAverisSubscriberModel();
  const sub = await AverisSubscriber.findOne({ telegramId, status: "active" });
  if (!sub) return { isSubscribed: false };

  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((sub.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  return { isSubscribed: true, daysLeft, expiryDate: sub.expiryDate, firstName: sub.firstName };
}
