import { NextRequest, NextResponse } from "next/server";
import { handleUpdate } from "@/bot/index";
import dbConnect from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure DB is connected before processing
    await dbConnect();

    // Delegate to grammY webhook handler
    return await handleUpdate(req);
  } catch (error) {
    console.error("Telegram webhook error:", error);
    // Always return 200 to prevent Telegram from retrying
    return NextResponse.json({ ok: true });
  }
}
