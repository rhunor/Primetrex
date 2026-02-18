import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const txRef = req.nextUrl.searchParams.get("tx_ref");

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "PrimetrexBot";

  // Redirect to Telegram bot deep link
  if (status === "successful") {
    return NextResponse.redirect(
      `https://t.me/${botUsername}?start=payment_success_${txRef}`
    );
  }

  return NextResponse.redirect(
    `https://t.me/${botUsername}?start=payment_failed`
  );
}
