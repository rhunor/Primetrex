import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BotPayment from "@/models/BotPayment";
import { activateSubscription } from "@/bot/services/subscription";
import type { FlutterwaveWebhookPayload } from "@/types/flutterwave";

export async function POST(req: NextRequest) {
  // Verify webhook signature
  const signature = req.headers.get("verif-hash");
  if (signature !== process.env.FLW_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: FlutterwaveWebhookPayload = await req.json();

  if (
    payload.event === "charge.completed" &&
    payload.data.status === "successful"
  ) {
    const txRef = payload.data.tx_ref;

    await dbConnect();

    // Update payment record
    await BotPayment.updateMany(
      { paymentRef: txRef },
      {
        status: "successful",
        flwRef: payload.data.flw_ref,
      }
    );

    // Activate subscription
    await activateSubscription(txRef);
  }

  return NextResponse.json({ status: "ok" });
}
