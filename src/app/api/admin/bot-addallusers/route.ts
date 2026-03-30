import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";
import { bot } from "@/bot/index";
import { EMOJI } from "@/bot/constants";
import { generateMultiChannelInvites, sendMultiChannelInviteDM, sleep } from "@/bot/services/invite";

export const maxDuration = 300;

const BATCH_DELAY_MS = 500; // retry logic handles actual 429s — 500ms is enough

async function runAddAllUsers(chatId: number, messageId: number) {
  try {
    await dbConnect();

    const plan = await Plan.findOne({ isActive: true });
    if (!plan || !plan.channels?.length) {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.CANCEL} No channels configured on the active plan.`);
      return;
    }

    // Only process users who haven't received their invite yet
    const pendingSubs = await BotSubscriber.find({
      status: "active",
      inviteSentAt: null,
    });
    const uniqueUserIds = [...new Set(pendingSubs.map((s) => s.userId))];
    const total = uniqueUserIds.length;

    if (total === 0) {
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.SUCCESS} <b>All done!</b>\n\nAll active subscribers have already received their invite links.\n\nTo resend to everyone, reset <code>inviteSentAt</code> in the DB first.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < uniqueUserIds.length; i++) {
      const userId = uniqueUserIds[i];

      // Update progress every 10 users
      if (i % 10 === 0) {
        try {
          await bot.api.editMessageText(
            chatId,
            messageId,
            `${EMOJI.HOURGLASS} <b>Sending invite links...</b>\n\nProgress: <b>${i}/${total}</b>\nSent: <b>${sent}</b> | Failed: <b>${failed}</b>`,
            { parse_mode: "HTML" }
          );
        } catch { /* editing can fail if message is too old — non-critical */ }
      }

      try {
        const invites = await generateMultiChannelInvites(plan.channels);
        if (invites.length > 0) {
          const dmSent = await sendMultiChannelInviteDM(userId, invites);
          if (dmSent) {
            // Mark as sent so re-runs skip this user
            await BotSubscriber.updateMany(
              { userId, status: "active" },
              { inviteSentAt: new Date() }
            );
            sent++;
          } else {
            // DM failed (user blocked the bot) — still mark to avoid infinite retries
            await BotSubscriber.updateMany(
              { userId, status: "active" },
              { inviteSentAt: new Date() }
            );
            failed++;
          }
        }
      } catch (err) {
        console.error(`Failed to send invite to user ${userId}:`, err);
        failed++;
        // Do NOT mark inviteSentAt — leave null so re-run retries this user
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
        ? `${EMOJI.TIP} Users who failed are still marked as sent. If you want to retry them, contact support to reset their <code>inviteSentAt</code>.`
        : `All subscribers have received their invite links.`),
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("addallusers error:", err);
    try {
      await bot.api.sendMessage(
        chatId,
        `${EMOJI.CANCEL} <b>Job failed mid-run.</b>\n\nCheck Vercel logs. Run <code>/addallusers</code> again — it will skip users already processed and continue from where it stopped.`,
        { parse_mode: "HTML" }
      );
    } catch { /* silent */ }
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, messageId } = await req.json();

  waitUntil(runAddAllUsers(chatId, messageId));

  return NextResponse.json({ ok: true });
}
