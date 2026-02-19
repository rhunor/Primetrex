import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { backButton } from "@/bot/keyboards/inline";
import { botConfig } from "@/bot/config";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import BotPayment from "@/models/BotPayment";
import Plan from "@/models/Plan";
import { verifyPayment } from "@/bot/services/flutterwave";
import { generateInviteLink } from "@/bot/services/invite";

// ── OpenAI vision: extract Flutterwave txRef from a screenshot ──────────────

async function extractTxRefFromImage(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'This is a Flutterwave payment confirmation screenshot. Extract ONLY the transaction reference ID (it starts with "PTRX-" or looks like "FLW-" or "TXN-"). Reply with just the reference ID, nothing else. If you cannot find a transaction reference, reply with "NOT_FOUND".',
              },
              {
                type: "image_url",
                image_url: { url: imageUrl, detail: "low" },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content?.trim() || "";

    if (!content || content === "NOT_FOUND") return null;

    // Extract anything that looks like a txRef
    const match =
      content.match(/PTRX-[\w-]+/i) ||
      content.match(/FLW-[\w-]+/i) ||
      content.match(/TXN-[\w-]+/i);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

// ── Core verification logic (shared by text and photo paths) ─────────────────

async function verifyAndActivate(ctx: BotContext, paymentRef: string) {
  const userId = ctx.from!.id.toString();
  await dbConnect();

  try {
    const result = await verifyPayment(paymentRef);

    if (result.status !== "success" || result.data?.status !== "successful") {
      await ctx.reply(
        `${EMOJI.CANCEL} <b>Payment Not Found</b>\n\n` +
          `We couldn't verify a successful payment for that reference.\n` +
          `Status: <b>${result.data?.status || "unknown"}</b>\n\n` +
          `Please double-check your reference and try again, or contact support.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Find the payment record — must belong to this user
    const payment = await BotPayment.findOne({ paymentRef });
    if (!payment) {
      await ctx.reply(
        `${EMOJI.WARNING} <b>Reference Not Linked</b>\n\n` +
          `This payment reference is not linked to any subscription order.\n\n` +
          `Please tap <b>Subscribe</b> to start a new order, then pay.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    if (payment.userId !== userId) {
      await ctx.reply(
        `${EMOJI.BLOCKED} This payment reference belongs to a different account.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const plan = await Plan.findById(payment.planId);
    if (!plan) {
      await ctx.reply("Associated plan not found. Please contact support.");
      return;
    }

    // Mark payment as successful
    await BotPayment.updateOne(
      { paymentRef },
      { status: "successful", flwRef: result.data.flw_ref }
    );

    const now = new Date();
    const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;

    // Create or extend subscription
    const existingSub = await BotSubscriber.findOne({
      userId,
      channelId: plan.channelId,
      status: "active",
    });

    let expiryDate: Date;
    if (existingSub) {
      expiryDate = new Date(existingSub.expiryDate.getTime() + durationMs);
      existingSub.expiryDate = expiryDate;
      await existingSub.save();
    } else {
      expiryDate = new Date(now.getTime() + durationMs);
      await BotSubscriber.create({
        userId,
        username: ctx.from?.username || null,
        firstName: ctx.from?.first_name || null,
        lastName: ctx.from?.last_name || null,
        planId: plan._id,
        channelId: plan.channelId,
        startDate: now,
        expiryDate,
        status: "active",
        addedBy: "payment",
      });
    }

    // Generate invite link and show to user
    try {
      const inviteLink = await generateInviteLink(plan.channelId);
      const expiryStr = expiryDate.toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: botConfig.timezone,
      });

      await ctx.reply(
        `${EMOJI.SUCCESS} <b>Payment Confirmed! Welcome to Primetrex!</b>\n\n` +
          `You now have access to <b>${plan.channelName}</b>.\n` +
          `Your subscription is active until <b>${expiryStr}</b>.\n\n` +
          `\u{1F517} <b>Tap below to join the channel:</b>\n` +
          `${inviteLink}\n\n` +
          `${EMOJI.WARNING} <i>This link expires in 24 hours and can only be used once. Join now!</i>`,
        {
          parse_mode: "HTML",
          reply_markup: backButton(CALLBACK.MAIN_MENU),
        }
      );
    } catch {
      await ctx.reply(
        `${EMOJI.SUCCESS} <b>Payment Confirmed!</b>\n\n` +
          `Your subscription is active but we couldn't generate your invite link right now.\n` +
          `Please contact the admin to get access.`,
        { parse_mode: "HTML" }
      );
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    await ctx.reply(
      `${EMOJI.CANCEL} Could not verify payment. Please try again or contact support.`
    );
  }
}

// ── Handler registration ─────────────────────────────────────────────────────

export function registerPaymentHandlers(bot: Bot<BotContext>) {
  // "I've Paid" callback
  bot.callbackQuery(CALLBACK.PAID, async (ctx) => {
    await ctx.answerCallbackQuery();
    await dbConnect();

    const userId = ctx.from!.id.toString();

    const pendingPayment = await BotPayment.findOne({ userId, status: "pending" });
    const existingSub = await BotSubscriber.findOne({ userId });

    if (!pendingPayment && !existingSub) {
      await ctx.editMessageText(
        `${EMOJI.WARNING} <b>No Order Found</b>\n\n` +
          `You haven't started a subscription order yet.\n` +
          `Tap <b>Subscribe</b> to choose a plan and make payment first.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    ctx.session.step = "awaiting_payment_proof";

    await ctx.editMessageText(
      `${EMOJI.SUCCESS} <b>Verify Your Payment</b>\n\n` +
        `Please send your <b>payment screenshot</b> or type your <b>transaction reference</b> (e.g. <code>PTRX-12345-...</code>).\n\n` +
        `${EMOJI.TIP} <i>The transaction reference can be found in your Flutterwave payment confirmation.</i>`,
      { parse_mode: "HTML" }
    );
  });

  // Handle photo proof of payment
  bot.on("message:photo", async (ctx, next) => {
    if (ctx.session.step !== "awaiting_payment_proof") return next();

    ctx.session.step = undefined;

    const statusMsg = await ctx.reply(
      `${EMOJI.HOURGLASS} Analysing your payment screenshot...`
    );

    // Get the highest resolution photo
    const photos = ctx.message.photo;
    const photo = photos[photos.length - 1];

    let txRef: string | null = null;

    try {
      const file = await ctx.api.getFile(photo.file_id);
      const imageUrl = `https://api.telegram.org/file/bot${botConfig.token}/${file.file_path}`;
      txRef = await extractTxRefFromImage(imageUrl);
    } catch {
      // OCR failed — fall through to ask for typed ref
    }

    // Delete the "analysing" status message
    try {
      await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
    } catch {
      /* ignore */
    }

    if (txRef) {
      await ctx.reply(
        `${EMOJI.SUCCESS} Found reference: <code>${txRef}</code>\n\nVerifying...`,
        { parse_mode: "HTML" }
      );
      await verifyAndActivate(ctx, txRef);
    } else {
      // Couldn't extract from image — ask user to type it
      ctx.session.step = "awaiting_payment_ref";
      await ctx.reply(
        `${EMOJI.WARNING} <b>Couldn't Read Reference</b>\n\n` +
          `We couldn't extract the transaction reference from your screenshot.\n\n` +
          `Please <b>type or paste</b> your transaction reference (e.g. <code>PTRX-12345-...</code>):`,
        { parse_mode: "HTML" }
      );
    }
  });

  // Handle typed payment reference
  bot.on("message:text", async (ctx, next) => {
    if (
      ctx.session.step !== "awaiting_payment_ref" &&
      ctx.session.step !== "awaiting_payment_proof"
    ) {
      return next();
    }

    ctx.session.step = undefined;
    const paymentRef = ctx.message.text.trim();

    await ctx.reply(`${EMOJI.HOURGLASS} Verifying payment...`);
    await verifyAndActivate(ctx, paymentRef);
  });
}
