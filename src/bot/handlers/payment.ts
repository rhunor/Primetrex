import { InlineKeyboard } from "grammy";
import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { backButton } from "@/bot/keyboards/inline";
import { botConfig } from "@/bot/config";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import BotPayment from "@/models/BotPayment";
import Plan from "@/models/Plan";
import User from "@/models/User";
import { verifyPayment } from "@/bot/services/korapay";
import { generateInviteLink } from "@/bot/services/invite";
import { createBotPaymentAndShowLink } from "@/bot/handlers/subscribe";
import { validateCoupon } from "@/lib/coupon";

// ── Core verification logic ───────────────────────────────────────────────────

async function verifyAndActivate(ctx: BotContext, paymentRef: string) {
  const userId = ctx.from!.id.toString();
  await dbConnect();

  try {
    const result = await verifyPayment(paymentRef);

    if (!result.status || result.data?.status !== "success") {
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
      { status: "successful", flwRef: result.data.payment_reference ?? paymentRef }
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

// ── Handler registration ──────────────────────────────────────────────────────

export function registerPaymentHandlers(bot: Bot<BotContext>) {
  // "I've Paid" callback — ask user to type their reference directly
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

    ctx.session.step = "awaiting_payment_ref";

    await ctx.editMessageText(
      `${EMOJI.SUCCESS} <b>Verify Your Payment</b>\n\n` +
        `Please type or paste your <b>transaction reference</b>\n` +
        `(e.g. <code>PTRX-12345-...</code>)\n\n` +
        `${EMOJI.TIP} <i>The transaction reference can be found in your Korapay payment confirmation.</i>`,
      { parse_mode: "HTML" }
    );
  });

  // Handle typed messages — coupon, referral code, OR payment reference step
  bot.on("message:text", async (ctx, next) => {
    // ── Payment coupon step ───────────────────────────────────────────────────
    if (ctx.session.step === "awaiting_payment_coupon") {
      const code = ctx.message.text.trim().toUpperCase();
      const telegramId = ctx.from!.id.toString();
      ctx.session.step = undefined;

      // Get base price to validate against
      await dbConnect();
      const plan = await Plan.findOne({ isActive: true });
      if (!plan) {
        await ctx.reply(`${EMOJI.CANCEL} No active plan found.`);
        return;
      }
      const planId = ctx.session.pendingPlanId;
      const isRenewal = !!planId;
      const basePrice = isRenewal ? plan.renewalPrice : plan.price;

      const result = await validateCoupon(code, basePrice, telegramId);
      if (!result.valid) {
        await ctx.reply(
          `${EMOJI.CANCEL} <b>Invalid coupon:</b> ${result.error}\n\n` +
          `Try again or proceed without a coupon.`,
          {
            parse_mode: "HTML",
            reply_markup: new InlineKeyboard()
              .text(`${EMOJI.COUPONS} Try another code`, CALLBACK.PAYMENT_COUPON_RETRY)
              .row()
              .text(`${EMOJI.ARROW} Proceed without coupon`, CALLBACK.PAYMENT_COUPON_SKIP),
          }
        );
        return;
      }

      ctx.session.pendingPaymentCouponCode = code;
      const discountText = result.finalAmount === 0
        ? `${EMOJI.GIFT} <b>Free renewal!</b> You pay nothing this month.`
        : `${EMOJI.GIFT} Discount applied: <b>${result.discountLabel}</b> — you pay <b>₦${result.finalAmount.toLocaleString("en-NG")}</b>`;

      await ctx.reply(
        `${EMOJI.SUCCESS} Coupon <code>${code}</code> accepted!\n\n${discountText}`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard()
            .text(`${EMOJI.ARROW} Continue to payment`, CALLBACK.PAYMENT_COUPON_SKIP),
        }
      );
      return;
    }

    // ── Referral code step ────────────────────────────────────────────────────
    if (ctx.session.step === "awaiting_referral_code") {
      const text = ctx.message.text.trim();

      if (text.toLowerCase() === "skip") {
        ctx.session.step = undefined;
        ctx.session.pendingReferralCode = null;
        await createBotPaymentAndShowLink(ctx);
        return;
      }

      // Validate referral code
      await dbConnect();
      const referrer = await User.findOne({ referralCode: text.toUpperCase() });
      if (!referrer) {
        // Stay in step — prompt again
        await ctx.reply(
          `${EMOJI.CANCEL} <b>Invalid referral code.</b>\n\n` +
            `Please check the code and try again, or type <code>skip</code> to continue without one.`,
          { parse_mode: "HTML" }
        );
        return;
      }

      ctx.session.step = undefined;
      ctx.session.pendingReferralCode = text.toUpperCase();
      await createBotPaymentAndShowLink(ctx);
      return;
    }

    // ── Payment reference step ────────────────────────────────────────────────
    if (ctx.session.step !== "awaiting_payment_ref") {
      return next();
    }

    ctx.session.step = undefined;
    const paymentRef = ctx.message.text.trim();

    await ctx.reply(`${EMOJI.HOURGLASS} Verifying payment...`);
    await verifyAndActivate(ctx, paymentRef);
  });
}
