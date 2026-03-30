import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";
import { bot } from "@/bot/index";
import { EMOJI } from "@/bot/constants";
import { generateMultiChannelInvites, sendMultiChannelInviteDM, sleep } from "@/bot/services/invite";

export const maxDuration = 300;

const BATCH_DELAY_MS = 400;

async function runAddAllUsers(chatId: number, messageId: number) {
  try {
    await dbConnect();

    const plan = await Plan.findOne({ isActive: true });
    if (!plan || !plan.channels?.length) {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.CANCEL} No channels configured on the active plan.`);
      return;
    }

    const activeSubs = await BotSubscriber.find({ status: "active" });
    const uniqueUserIds = [...new Set(activeSubs.map((s) => s.userId))];

    let sent = 0;
    let failed = 0;

    for (const userId of uniqueUserIds) {
      try {
        const invites = await generateMultiChannelInvites(plan.channels);
        if (invites.length > 0) {
          await sendMultiChannelInviteDM(userId, invites);
          sent++;
        }
      } catch {
        failed++;
      }
      await sleep(BATCH_DELAY_MS);
    }

    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.SUCCESS} <b>Done!</b>\n\nInvite links sent to: <b>${sent}</b> subscribers\nFailed: <b>${failed}</b>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("addallusers error:", err);
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

  // Return 200 immediately — run the long work in the background
  waitUntil(runAddAllUsers(chatId, messageId));

  return NextResponse.json({ ok: true });
}
