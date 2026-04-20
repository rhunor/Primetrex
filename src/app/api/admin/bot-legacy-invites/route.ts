import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import { bot } from "@/bot/index";
import { sleep } from "@/bot/services/invite";
import { EMOJI } from "@/bot/constants";

export const maxDuration = 300;

const LEGACY_CHANNEL_ID = "-1003699209692";

const INVITE_MESSAGE = `Hello, this is Primetrex community

We noticed the bot malfunctioned and removed you from the general community

We apologise for this

This is a link to join the community again👇👇`;

type MembershipStatus = "in_group" | "left_voluntarily" | "kicked" | "never_joined" | "unknown";

async function checkLegacyMembership(userId: string): Promise<MembershipStatus> {
  try {
    const member = await bot.api.getChatMember(Number(LEGACY_CHANNEL_ID), Number(userId));
    if (member.status === "member" || member.status === "administrator" || member.status === "creator") {
      return "in_group";
    }
    if (member.status === "left") return "left_voluntarily";
    if (member.status === "kicked" || member.status === "restricted") return "kicked";
    return "unknown";
  } catch {
    return "never_joined";
  }
}

function buildProgressMsg(
  phase: "checking" | "sending",
  current: number,
  total: number,
  stats: {
    inGroup: number;
    leftVoluntarily: number;
    kicked: number;
    neverJoined: number;
    sent: number;
    failed: number;
    toSend: number;
  }
): string {
  if (phase === "checking") {
    return (
      `${EMOJI.HOURGLASS} <b>Phase 1/2 — Checking legacy group membership...</b>\n\n` +
      `Checked: <b>${current}/${total}</b>\n\n` +
      `✅ Still in group: <b>${stats.inGroup}</b>\n` +
      `🚶 Left voluntarily: <b>${stats.leftVoluntarily}</b>\n` +
      `🚫 Removed/kicked: <b>${stats.kicked}</b>\n` +
      `❓ Never joined / unknown: <b>${stats.neverJoined}</b>`
    );
  }
  return (
    `${EMOJI.HOURGLASS} <b>Phase 2/2 — Sending invites...</b>\n\n` +
    `Progress: <b>${current}/${stats.toSend}</b>\n` +
    `✅ Invite sent: <b>${stats.sent}</b>\n` +
    `❌ Could not DM (blocked bot): <b>${stats.failed}</b>\n\n` +
    `<i>If this stops, re-run /sendlegacyinvites — it only sends to those who still haven't received one.</i>`
  );
}

async function runSendLegacyInvites(chatId: number, messageId: number) {
  try {
    await dbConnect();

    const allUserIds = await BotSubscriber.distinct("userId");
    const total = allUserIds.length;

    if (total === 0) {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.WARNING} No subscribers found in the database.`);
      return;
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.HOURGLASS} <b>Phase 1/2 — Checking legacy group membership...</b>\n\nChecking <b>${total}</b> total subscribers...`,
      { parse_mode: "HTML" }
    );

    // Phase 1: Check membership status for every subscriber
    const stats = { inGroup: 0, leftVoluntarily: 0, kicked: 0, neverJoined: 0, sent: 0, failed: 0, toSend: 0 };
    const notInGroup: string[] = [];

    for (let i = 0; i < allUserIds.length; i++) {
      const userId = allUserIds[i];
      const status = await checkLegacyMembership(userId);

      if (status === "in_group") {
        stats.inGroup++;
      } else {
        notInGroup.push(userId);
        if (status === "left_voluntarily") stats.leftVoluntarily++;
        else if (status === "kicked") stats.kicked++;
        else stats.neverJoined++;
      }

      await sleep(300);

      // Update every 5 users
      if ((i + 1) % 5 === 0 || i === allUserIds.length - 1) {
        try {
          await bot.api.editMessageText(
            chatId,
            messageId,
            buildProgressMsg("checking", i + 1, total, stats),
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical — Telegram rate limits edits */ }
      }
    }

    if (notInGroup.length === 0) {
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.SUCCESS} <b>All ${total} subscribers are in the legacy group.</b>\n\nNo invites needed.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Generate one unlimited invite link
    let legacyLink: string;
    try {
      const invite = await bot.api.createChatInviteLink(Number(LEGACY_CHANNEL_ID), { member_limit: 0 });
      legacyLink = invite.invite_link;
    } catch (err) {
      console.error("[legacy-invites] Failed to generate invite link:", err);
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.CANCEL} Failed to generate invite link. Make sure the bot is an admin in the legacy group.`
      );
      return;
    }

    stats.toSend = notInGroup.length;

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.HOURGLASS} <b>Phase 2/2 — Sending invites to ${notInGroup.length} users...</b>\n\nStarting...`,
      { parse_mode: "HTML" }
    );

    // Phase 2: Send invites
    for (let i = 0; i < notInGroup.length; i++) {
      const userId = notInGroup[i];

      try {
        await bot.api.sendMessage(Number(userId), `${INVITE_MESSAGE}\n\n${legacyLink}`);
        stats.sent++;
      } catch {
        stats.failed++;
      }

      await sleep(400);

      // Update every 5 users
      if ((i + 1) % 5 === 0 || i === notInGroup.length - 1) {
        try {
          await bot.api.editMessageText(
            chatId,
            messageId,
            buildProgressMsg("sending", i + 1, total, stats),
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical */ }
      }
    }

    // Final summary
    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.SUCCESS} <b>Done!</b>\n\n` +
      `<b>📊 Membership Report (${total} total subscribers)</b>\n` +
      `✅ Already in group: <b>${stats.inGroup}</b>\n` +
      `🚶 Left voluntarily: <b>${stats.leftVoluntarily}</b>\n` +
      `🚫 Removed/kicked: <b>${stats.kicked}</b>\n` +
      `❓ Never joined / bot can't check: <b>${stats.neverJoined}</b>\n\n` +
      `<b>📨 Invites sent (${notInGroup.length} users)</b>\n` +
      `✅ DM delivered: <b>${stats.sent}</b>\n` +
      `❌ Could not DM (blocked bot): <b>${stats.failed}</b>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("[legacy-invites] Job crashed:", err);
    try {
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.CANCEL} <b>Job crashed mid-run.</b>\n\nRun <b>/sendlegacyinvites</b> again — it will resume from where it left off and only send to users who haven't received an invite yet.`,
        { parse_mode: "HTML" }
      );
    } catch {
      await bot.api.sendMessage(chatId, `${EMOJI.CANCEL} Job crashed. Re-run /sendlegacyinvites to resume.`);
    }
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
