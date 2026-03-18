import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredFromChannel } from "@/bot/services/expiry";
import { bot } from "@/bot/index";
import { EMOJI } from "@/bot/constants";

export async function POST(req: NextRequest) {
  // Internal secret so only our bot handler can trigger this
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, messageId } = await req.json();

  try {
    const { removed, failed } = await cleanupExpiredFromChannel();
    await bot.api.editMessageText(
      chatId,
      messageId,
      `${EMOJI.SUCCESS} <b>Cleanup complete</b>\n\n` +
        `Removed: <b>${removed}</b>\n` +
        `Failed (already left/not found): <b>${failed}</b>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("Cleanup error:", err);
    await bot.api.sendMessage(chatId, `${EMOJI.CANCEL} Cleanup failed. Check logs.`);
  }

  return NextResponse.json({ ok: true });
}
