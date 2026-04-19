import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import { bot } from "@/bot/index";
import { generateInviteLink, sleep } from "@/bot/services/invite";
import { EMOJI } from "@/bot/constants";

export const maxDuration = 300;

const LEGACY_CHANNEL_ID = "-1003699209692";
const LEGACY_CHANNEL_NAME = "Primetrex Community";

async function runSendLegacyInvites(chatId: number, messageId: number) {
  try {
    await dbConnect();

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Find unique userIds whose subscriptions expired in the last 14 days
    const expired = await BotSubscriber.find({
      status: "expired",
      updatedAt: { $gte: since },
      channelId: { $ne: LEGACY_CHANNEL_ID },
    }).lean();

    const uniqueUserIds = [...new Set(expired.map((s) => s.userId))];
    const total = uniqueUserIds.length;

    if (total === 0) {
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.WARNING} No users found with expired subscriptions in the last 14 days.`
      );
      return;
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.HOURGLASS} <b>Generating legacy channel invite link...</b>`,
      { parse_mode: "HTML" }
    );

    // Generate one shared legacy channel invite link (member_limit: 0 = unlimited)
    let legacyLink: string;
    try {
      const invite = await bot.api.createChatInviteLink(Number(LEGACY_CHANNEL_ID), {
        member_limit: 0, // unlimited uses for bulk send
      });
      legacyLink = invite.invite_link;
    } catch (err) {
      console.error("[legacy-invites] Failed to generate invite link:", err);
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.CANCEL} Failed to generate invite link for legacy channel. Check bot permissions.`);
      return;
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.HOURGLASS} <b>Sending legacy channel invites...</b>\n\nProgress: <b>0/${total}</b>`,
      { parse_mode: "HTML" }
    );

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < uniqueUserIds.length; i++) {
      const userId = uniqueUserIds[i];

      try {
        await bot.api.sendMessage(
          Number(userId),
          `${EMOJI.INVITE} <b>Primetrex Community Access</b>\n\n` +
          `You've been sent a link to re-join the Primetrex Community group:\n\n` +
          `${"\u{1F517}"} ${legacyLink}`,
          { parse_mode: "HTML" }
        );
        sent++;
      } catch {
        failed++;
      }

      if ((i + 1) % 10 === 0) {
        try {
          await bot.api.editMessageText(
            chatId,
            messageId,
            `${EMOJI.HOURGLASS} <b>Sending legacy channel invites...</b>\n\nProgress: <b>${i + 1}/${total}</b>\n✅ Sent: <b>${sent}</b>\n❌ Failed (blocked bot): <b>${failed}</b>`,
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical */ }
      }

      await sleep(400);
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.SUCCESS} <b>Done!</b>\n\n` +
      `Total users from last 14 days: <b>${total}</b>\n` +
      `✅ Invite sent: <b>${sent}</b>\n` +
      `❌ Could not DM (blocked bot): <b>${failed}</b>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("[legacy-invites] Job error:", err);
    try {
      await bot.api.sendMessage(chatId, `${EMOJI.CANCEL} Failed mid-run. Check Vercel logs.`);
    } catch { /* silent */ }
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, messageId } = await req.json();
  waitUntil(runSendLegacyInvites(chatId, messageId));
  return NextResponse.json({ ok: true });
}
