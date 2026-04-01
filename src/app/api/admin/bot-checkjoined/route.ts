import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";
import { bot } from "@/bot/index";
import { EMOJI } from "@/bot/constants";
import { sleep } from "@/bot/services/invite";

export const maxDuration = 300;

const CHECK_DELAY_MS = 300;
const STALL_THRESHOLD_MS = 20000;
const PROGRESS_EVERY = 10;

async function getChatMemberStatus(channelId: string, userId: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const member = await bot.api.getChatMember(Number(channelId), Number(userId));
      return member.status;
    } catch (err: unknown) {
      const retryAfter =
        err && typeof err === "object" && "parameters" in err
          ? (err as { parameters?: { retry_after?: number } }).parameters?.retry_after
          : undefined;
      if (retryAfter && attempt < 2) {
        await sleep((retryAfter + 1) * 1000);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

async function runCheckJoined(chatId: number, messageId: number) {
  try {
    await dbConnect();

    const plan = await Plan.findOne({ isActive: true });
    if (!plan || !plan.channels?.length) {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.CANCEL} No channels configured on the active plan.`);
      return;
    }

    const subs = await BotSubscriber.find({ status: "active", inviteSentAt: { $ne: null } });
    const uniqueUserIds = [...new Set(subs.map((s) => s.userId))];
    const total = uniqueUserIds.length;

    if (total === 0) {
      await bot.api.editMessageText(
        chatId,
        messageId,
        `${EMOJI.WARNING} No users with invite links sent yet. Run /addallusers first.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    let checked = 0;
    let fullyJoined = 0;       // in all channels
    let partiallyJoined = 0;   // in some but not all
    let notJoined = 0;         // not in any channel
    let errors = 0;

    for (let i = 0; i < uniqueUserIds.length; i++) {
      const userId = uniqueUserIds[i];
      const iterStart = Date.now();

      if (i % PROGRESS_EVERY === 0) {
        try {
          await bot.api.editMessageText(
            chatId,
            messageId,
            `${EMOJI.HOURGLASS} <b>Checking membership...</b>\n\n` +
            `Progress: <b>${i}/${total}</b>\n` +
            `✅ All channels joined: <b>${fullyJoined}</b>\n` +
            `🔄 Partial (some channels missing): <b>${partiallyJoined}</b>\n` +
            `❌ Not joined any: <b>${notJoined}</b>\n` +
            `⚠️ Could not check: <b>${errors}</b>`,
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical */ }
      }

      try {
        const missingChannels: string[] = [];

        for (const channel of plan.channels) {
          try {
            const status = await getChatMemberStatus(channel.channelId, userId);
            const isIn = status === "member" || status === "administrator" || status === "creator";
            if (!isIn) {
              missingChannels.push(channel.channelId);
            }
          } catch {
            // Can't determine — assume not joined, will resend
            missingChannels.push(channel.channelId);
          }
          await sleep(200);
        }

        if (missingChannels.length === 0) {
          fullyJoined++;
        } else if (missingChannels.length < plan.channels.length) {
          // Partial — reset only the specific channels they haven't joined
          await BotSubscriber.updateMany(
            { userId, status: "active", channelId: { $in: missingChannels } },
            { inviteSentAt: null }
          );
          partiallyJoined++;
        } else {
          // Not in any channel — reset all
          await BotSubscriber.updateMany(
            { userId, status: "active" },
            { inviteSentAt: null }
          );
          notJoined++;
        }
      } catch {
        errors++;
      }

      checked++;

      const elapsed = Date.now() - iterStart;
      if (elapsed > STALL_THRESHOLD_MS) {
        console.warn(`checkjoined: user ${userId} took ${elapsed}ms — possible stall`);
      }

      await sleep(CHECK_DELAY_MS);
    }

    const needsResend = notJoined + partiallyJoined;

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.SUCCESS} <b>Check complete!</b>\n\n` +
      `Total checked: <b>${checked}</b>\n` +
      `✅ Joined all channels: <b>${fullyJoined}</b>\n` +
      `🔄 Joined some channels (missing links reset): <b>${partiallyJoined}</b>\n` +
      `❌ Not joined any (all links reset): <b>${notJoined}</b>\n` +
      `⚠️ Could not check: <b>${errors}</b>\n\n` +
      (needsResend > 0
        ? `${EMOJI.POINT_DOWN} Run <b>/addallusers</b> now to send fresh links to <b>${needsResend}</b> users for only the channels they haven't joined.`
        : `Everyone has joined all channels. No action needed.`),
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("checkjoined error:", err);
    try {
      await bot.api.sendMessage(
        chatId,
        `${EMOJI.CANCEL} <b>Job failed mid-run.</b>\n\nRun <code>/checkjoined</code> again — it will resume from where it stopped.\n\nCheck Vercel logs for details.`,
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

  waitUntil(runCheckJoined(chatId, messageId));

  return NextResponse.json({ ok: true });
}
