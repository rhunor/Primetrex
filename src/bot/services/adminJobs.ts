import { waitUntil } from "@vercel/functions";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";
import { bot } from "@/bot/index";
import { EMOJI } from "@/bot/constants";
import { generateMultiChannelInvites, sendMultiChannelInviteDM, sleep } from "@/bot/services/invite";

const BATCH_DELAY_MS = 500;

export async function runAddAllUsers(chatId: number, messageId: number) {
  try {
    await dbConnect();

    const plan = await Plan.findOne({ isActive: true });
    if (!plan || !plan.channels?.length) {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.CANCEL} No channels configured on the active plan.`);
      return;
    }

    const pendingSubs = await BotSubscriber.find({ status: "active", inviteSentAt: null });
    const uniqueUserIds = [...new Set(pendingSubs.map((s) => s.userId))];
    const total = uniqueUserIds.length;

    if (total === 0) {
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.SUCCESS} <b>All done!</b>\n\nAll active subscribers have already received their invite links.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < uniqueUserIds.length; i++) {
      const userId = uniqueUserIds[i];

      if (i % 10 === 0) {
        try {
          await bot.api.editMessageText(
            chatId,
            messageId,
            `${EMOJI.HOURGLASS} <b>Sending invite links...</b>\n\nProgress: <b>${i}/${total}</b>\nSent: <b>${sent}</b> | Failed: <b>${failed}</b>`,
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical */ }
      }

      try {
        const invites = await generateMultiChannelInvites(plan.channels);
        if (invites.length > 0) {
          const dmSent = await sendMultiChannelInviteDM(userId, invites);
          await BotSubscriber.updateMany(
            { userId, status: "active" },
            { inviteSentAt: new Date() }
          );
          if (dmSent) sent++;
          else failed++;
        }
      } catch (err) {
        console.error(`Failed to send invite to user ${userId}:`, err);
        failed++;
        // inviteSentAt left null — will retry on next run
      }

      await sleep(BATCH_DELAY_MS);
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.SUCCESS} <b>Done!</b>\n\n` +
      `Total processed: <b>${total}</b>\n` +
      `✅ Successfully sent: <b>${sent}</b>\n` +
      `⚠️ Blocked bot / DM failed: <b>${failed}</b>\n\n` +
      (failed > 0
        ? `Run <code>/addallusers</code> again to retry failed users.`
        : `All subscribers have received their invite links.`),
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("addallusers error:", err);
    try {
      await bot.api.sendMessage(
        chatId,
        `${EMOJI.CANCEL} <b>Job failed mid-run.</b>\n\nRun <code>/addallusers</code> again — it will skip users already processed.`,
        { parse_mode: "HTML" }
      );
    } catch { /* silent */ }
  }
}

export function triggerAddAllUsers(chatId: number, messageId: number) {
  waitUntil(runAddAllUsers(chatId, messageId));
}
