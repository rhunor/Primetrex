import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";
import { bot } from "@/bot/index";
import { EMOJI } from "@/bot/constants";
import { generateMultiChannelInvites, sendMultiChannelInviteDM, sleep } from "@/bot/services/invite";

const BATCH_DELAY_MS = 500; // delay between users to avoid rate limits

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, messageId } = await req.json();

  try {
    await dbConnect();

    const plan = await Plan.findOne({ isActive: true });
    if (!plan || !plan.channels?.length) {
      await bot.api.editMessageText(chatId, messageId, `${EMOJI.CANCEL} No channels configured on the active plan.`);
      return NextResponse.json({ ok: true });
    }

    // Get unique active subscriber user IDs
    const activeSubs = await BotSubscriber.find({ status: "active" });
    const uniqueUserIds = [...new Set(activeSubs.map((s) => s.userId))];

    let sent = 0;
    let failed = 0;

    for (const userId of uniqueUserIds) {
      try {
        // Only send links for channels the user doesn't already have an active record for
        const userSubs = await BotSubscriber.find({ userId, status: "active" });
        const userChannelIds = new Set(userSubs.map((s) => s.channelId));
        const missingChannels = plan.channels.filter((c) => !userChannelIds.has(c.channelId));

        if (missingChannels.length === 0) continue;

        const invites = await generateMultiChannelInvites(missingChannels);
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
    await bot.api.sendMessage(chatId, `${EMOJI.CANCEL} Failed. Check logs.`);
  }

  return NextResponse.json({ ok: true });
}
