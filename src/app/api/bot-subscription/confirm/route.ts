import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import BotPayment from "@/models/BotPayment";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { activateSubscription } from "@/bot/services/subscription";
import { verifyPaymentByRef } from "@/lib/flutterwave-web";
import { notifyCommissionEarned } from "@/lib/notifications";
import { siteConfig } from "@/config/site";

/**
 * Confirms a web-initiated bot subscription payment.
 * Called from the dashboard after Flutterwave redirects back.
 * This is the primary activation path — the webhook is a backup.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const txRef: string | undefined = body?.txRef;
  if (!txRef || typeof txRef !== "string") {
    return NextResponse.json({ error: "Missing txRef" }, { status: 400 });
  }

  try {
    await dbConnect();

    const botPayment = await BotPayment.findOne({ paymentRef: txRef });
    if (!botPayment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Security: this payment must belong to the current web user
    if (!botPayment.webUserId || botPayment.webUserId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Idempotent: already activated (webhook got here first)
    if (botPayment.status === "successful") {
      return NextResponse.json({ success: true, already: true });
    }

    // Verify with Flutterwave directly
    const flwResult = await verifyPaymentByRef(txRef);
    if (!flwResult.data || flwResult.data.status !== "successful") {
      return NextResponse.json(
        { error: "Payment not yet confirmed by Flutterwave. Please wait a moment and refresh." },
        { status: 402 }
      );
    }

    // Store flwRef without setting status — activateSubscription sets it atomically
    await BotPayment.updateOne({ paymentRef: txRef }, { flwRef: flwResult.data.flw_ref });

    // Activate: creates BotSubscriber, sets payment.status="successful", sends invite DM
    await activateSubscription(txRef);

    // Generate commissions via the web user's referredBy chain
    const webUser = await User.findById(botPayment.webUserId);
    if (webUser?.referredBy) {
      const existingComm = await Transaction.findOne({
        paymentReference: txRef,
        type: "commission",
      });

      if (!existingComm) {
        const paidAmount = botPayment.amount;

        const tier1Amount = paidAmount * (siteConfig.commission.tier1Rate / 100);
        await Transaction.create({
          userId: webUser.referredBy,
          type: "commission",
          amount: tier1Amount,
          tier: 1,
          status: "completed",
          sourceUserId: webUser._id,
          paymentReference: txRef,
          description: `Tier 1 commission from ${webUser.firstName} ${webUser.lastName} (bot sub via web)`,
        });
        notifyCommissionEarned(
          webUser.referredBy,
          tier1Amount,
          1,
          `${webUser.firstName} ${webUser.lastName}`
        ).catch(() => {});

        const tier1Referrer = await User.findById(webUser.referredBy);
        if (tier1Referrer?.referredBy) {
          const tier2Amount = paidAmount * (siteConfig.commission.tier2Rate / 100);
          await Transaction.create({
            userId: tier1Referrer.referredBy,
            type: "commission",
            amount: tier2Amount,
            tier: 2,
            status: "completed",
            sourceUserId: webUser._id,
            paymentReference: `${txRef}-t2`,
            description: `Tier 2 commission from ${webUser.firstName} ${webUser.lastName} (bot sub via web)`,
          });
          notifyCommissionEarned(
            tier1Referrer.referredBy,
            tier2Amount,
            2,
            `${webUser.firstName} ${webUser.lastName}`
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true, already: false });
  } catch (error) {
    console.error("[bot-subscription/confirm] Error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment. Please contact support." },
      { status: 500 }
    );
  }
}
