import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setWebhook, getWebhookInfo } from "@/lib/telegram";

// GET: Check current webhook status
export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as unknown as Record<string, unknown> | undefined;
    if (!session?.user || user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const info = await getWebhookInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error("Telegram webhook info error:", error);
    return NextResponse.json(
      { error: "Failed to get webhook info" },
      { status: 500 }
    );
  }
}

// POST: Set up the webhook (one-time setup, admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as unknown as Record<string, unknown> | undefined;
    if (!session?.user || user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const appUrl = body.url || process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        { error: "App URL is required" },
        { status: 400 }
      );
    }

    const webhookUrl = `${appUrl}/api/webhooks/telegram`;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "TELEGRAM_WEBHOOK_SECRET env var is not set" },
        { status: 500 }
      );
    }

    const result = await setWebhook(webhookUrl, secret);
    return NextResponse.json({ success: true, webhookUrl, result });
  } catch (error) {
    console.error("Telegram webhook setup error:", error);
    return NextResponse.json(
      { error: "Failed to set webhook" },
      { status: 500 }
    );
  }
}
