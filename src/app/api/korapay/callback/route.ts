/**
 * Korapay redirect callback.
 * After payment, Korapay appends ?reference=YOUR_REFERENCE to the redirect URL.
 *
 * For bot PTRX- payments: verify the charge and redirect to Telegram.
 * Web-initiated payments (PTXW-*) redirect back to the web app — handled there.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCharge } from "@/lib/korapay";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "PrimetrexBot";

  if (!reference) {
    return NextResponse.redirect(
      `https://t.me/${botUsername}?start=payment_failed`
    );
  }

  try {
    const result = await verifyCharge(reference);

    if (result.status && result.data?.status === "success") {
      return NextResponse.redirect(
        `https://t.me/${botUsername}?start=payment_success_${reference}`
      );
    }
  } catch {
    // Fall through to failed redirect
  }

  return NextResponse.redirect(
    `https://t.me/${botUsername}?start=payment_failed`
  );
}
