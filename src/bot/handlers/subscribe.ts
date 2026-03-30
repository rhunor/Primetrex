import { InlineKeyboard } from "grammy";
import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import {
  subscriptionSummaryKeyboard,
  paymentReadyKeyboard,
} from "@/bot/keyboards/inline";
import dbConnect from "@/lib/db";
import Plan from "@/models/Plan";
import BotSubscriber from "@/models/BotSubscriber";
import BotPayment from "@/models/BotPayment";
import SpecialUser from "@/models/SpecialUser";
import SpecialConfig from "@/models/SpecialConfig";
import {
  generatePaymentLink,
  generateTxRef,
} from "@/bot/services/korapay";
import { botConfig } from "@/bot/config";
import { validateCoupon, applyCouponUsage } from "@/lib/coupon";
import { generateMultiChannelInvites, sendMultiChannelInviteDM, sleep, RATE_LIMIT_DELAY_MS } from "@/bot/services/invite";

function formatNaira(amount: number): string {
  return `\u20A6${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export async function showSubscriptionSummary(
  ctx: BotContext,
  isRenewal: boolean
) {
  await dbConnect();
  const userId = ctx.from!.id.toString();

  const plan = await Plan.findOne({ isActive: true });
  if (!plan) {
    const text = "No active plans available. Please contact the admin.";
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text);
    } else {
      await ctx.reply(text);
    }
    return;
  }

  if (isRenewal) {
    // Check if user has existing subscription
    const existing = await BotSubscriber.findOne({ userId });
    if (!existing) {
      const text =
        `${EMOJI.WARNING} <b>First Time Subscriber?</b>\n\n` +
        `You are a first time subscriber. Please use the <b>Subscribe</b> button to start your first plan.`;
      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, { parse_mode: "HTML" });
      } else {
        await ctx.reply(text, { parse_mode: "HTML" });
      }
      return;
    }
  }

  const basePrice = isRenewal ? plan.renewalPrice : plan.price;
  let discount = 0;
  let discountText = "";

  // Check if user is a special (whitelisted) user
  const specialUser = await SpecialUser.findOne({ userId });
  if (specialUser) {
    const config = await SpecialConfig.findOne();
    if (config) {
      if (config.discountType === "fixed") {
        discount = config.discountValue;
      } else {
        discount = (basePrice * config.discountValue) / 100;
      }
      discountText = `${EMOJI.GIFT} Discount: -${formatNaira(discount)}\n`;
    }
  }

  const total = basePrice - discount;
  const planLabel = isRenewal ? "Primetrex renewal" : "Primetrex first payment";
  const channels = plan.channels?.length
    ? plan.channels
    : [{ channelId: plan.channelId, channelName: plan.channelName }];
  const channelLine = channels.length > 1
    ? `Channels: <b>${channels.length} Primetrex channels</b>\n`
    : `Channel: ${channels[0]?.channelName || plan.channelName}\n`;

  const text =
    `${EMOJI.SUBSCRIBE} <b>Subscription Summary</b>\n` +
    `Plan: <b>${planLabel}</b>\n` +
    channelLine +
    `Price: ${formatNaira(basePrice)}\n` +
    discountText +
    `Total: <b>${formatNaira(total)}</b>\n\n` +
    `${EMOJI.POINT_DOWN} <b>Select Payment Method:</b>`;

  // Store plan info in session for payment step
  ctx.session.pendingPlanId = plan._id.toString();

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: subscriptionSummaryKeyboard(),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: subscriptionSummaryKeyboard(),
    });
  }
}

/**
 * Creates the BotPayment record and shows the Flutterwave payment link.
 * Called after the referral code step (for new subscriptions) or directly (for renewals).
 */
export async function createBotPaymentAndShowLink(ctx: BotContext) {
  await dbConnect();
  const userId = ctx.from!.id;
  const userIdStr = userId.toString();

  const planId = ctx.session.pendingPlanId;
  if (!planId) {
    await ctx.reply("Session expired. Please start over.");
    return;
  }

  const plan = await Plan.findById(planId);
  if (!plan) {
    await ctx.reply("Plan not found.");
    return;
  }

  // Determine price (check renewal vs new)
  const existing = await BotSubscriber.findOne({ userId: userIdStr });
  const isRenewal = !!existing;
  let price = isRenewal ? plan.renewalPrice : plan.price;

  // Apply special user discount
  const specialUser = await SpecialUser.findOne({ userId: userIdStr });
  if (specialUser) {
    const config = await SpecialConfig.findOne();
    if (config) {
      if (config.discountType === "fixed") {
        price -= config.discountValue;
      } else {
        price -= (price * config.discountValue) / 100;
      }
    }
  }

  // Apply coupon discount from session
  const couponCode = ctx.session.pendingPaymentCouponCode;
  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, price, userIdStr);
    if (couponResult.valid) {
      price = couponResult.finalAmount;
      ctx.session.pendingPaymentDiscount = couponResult.discountAmount;
    }
    ctx.session.pendingPaymentCouponCode = undefined;
  }

  price = Math.max(price, 0);

  const txRef = generateTxRef(userId);
  const referralCode = ctx.session.pendingReferralCode ?? null;

  // Clear session fields after reading
  ctx.session.pendingReferralCode = undefined;
  ctx.session.pendingIsRenewal = undefined;
  ctx.session.pendingPaymentDiscount = undefined;

  // Handle free renewal (100% coupon) — skip Korapay entirely
  if (price === 0) {
    const now = new Date();
    const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;
    const expiryDate = new Date(now.getTime() + durationMs);
    const channels = plan.channels?.length
      ? plan.channels
      : [{ channelId: plan.channelId, channelName: plan.channelName }];

    for (const channel of channels) {
      const existingSub = await BotSubscriber.findOne({ userId: userIdStr, channelId: channel.channelId, status: "active" });
      if (existingSub) {
        existingSub.expiryDate = new Date(existingSub.expiryDate.getTime() + durationMs);
        await existingSub.save();
      } else {
        await BotSubscriber.create({
          userId: userIdStr,
          planId: plan._id,
          channelId: channel.channelId,
          startDate: now,
          expiryDate,
          status: "active",
          addedBy: "coupon",
        });
      }
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    if (couponCode) await applyCouponUsage(couponCode, userIdStr);

    try {
      const invites = await generateMultiChannelInvites(channels);
      await sendMultiChannelInviteDM(userIdStr, invites);
    } catch { /* silent */ }

    await ctx.reply(
      `${EMOJI.SUCCESS} <b>Free Renewal Activated!</b>\n\n` +
      `Your coupon code gave you a free month of access to all Primetrex channels.\n\n` +
      `Check your messages — your invite links have been sent.`,
      { parse_mode: "HTML" }
    );
    return;
  }

  // Create payment record
  await BotPayment.create({
    userId: userIdStr,
    planId: plan._id,
    amount: price,
    paymentRef: txRef,
    paymentType: isRenewal ? "renewal" : "new",
    status: "pending",
    referralCode,
  });

  if (couponCode) await applyCouponUsage(couponCode, userIdStr);

  try {
    const paymentUrl = await generatePaymentLink({
      txRef,
      amount: price,
      customerEmail: `user_${userId}@telegram.primetrexaffiliates.com`,
      customerName: ctx.from!.first_name || "User",
      planName: plan.name,
    });

    const text =
      `${EMOJI.SUBSCRIBE} <b>Payment Ready</b>\n` +
      `Plan: Primetrex Community\n` +
      `Amount: <b>${formatNaira(price)}</b>\n\n` +
      `Click below to complete your payment.`;

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: paymentReadyKeyboard(paymentUrl, formatNaira(price)),
    });
  } catch (error) {
    console.error("Korapay payment link error:", error);
    await ctx.reply(
      `${EMOJI.CANCEL} Failed to generate payment link. Please try again later.`
    );
  }
}

async function handlePayKorapay(ctx: BotContext) {
  await dbConnect();
  const userId = ctx.from!.id.toString();

  const planId = ctx.session.pendingPlanId;
  if (!planId) {
    await ctx.editMessageText("Session expired. Please start over.");
    return;
  }

  // Determine if this is a renewal
  const existing = await BotSubscriber.findOne({ userId });
  const isRenewal = !!existing;
  ctx.session.pendingIsRenewal = isRenewal;

  if (isRenewal) {
    // Ask if user has a coupon code before generating payment link
    await ctx.editMessageText(
      `${EMOJI.COUPONS} <b>Do you have a coupon code?</b>\n\n` +
      `You can apply a discount coupon for your renewal.`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard()
          .text(`${EMOJI.SUCCESS} Yes, I have a code`, CALLBACK.PAYMENT_COUPON_YES)
          .row()
          .text(`${EMOJI.ARROW} No, proceed to payment`, CALLBACK.PAYMENT_COUPON_SKIP),
      }
    );
    return;
  }

  // New subscription: redirect to website for first payment
  const websiteUrl = `${botConfig.appUrl}/dashboard/bot-subscribe`;
  await ctx.editMessageText(
    `${EMOJI.SUBSCRIBE} <b>First Subscription Payment</b>\n\n` +
      `To complete your first payment, please visit the Primetrex website.\n\n` +
      `After payment, your channel invite link will be sent to you here on Telegram automatically.\n\n` +
      `${EMOJI.POINT_DOWN} Tap the button below to pay:`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .url(`${EMOJI.LINK} Pay on Website`, websiteUrl)
        .row()
        .text(`${EMOJI.CANCEL} Cancel`, CALLBACK.PAY_CANCEL),
    }
  );
}

export function registerSubscribeHandlers(bot: Bot<BotContext>) {
  // Subscribe callback
  bot.callbackQuery(CALLBACK.SUBSCRIBE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showSubscriptionSummary(ctx, false);
  });

  // Renew callback
  bot.callbackQuery(CALLBACK.RENEW, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showSubscriptionSummary(ctx, true);
  });

  // Pay with Korapay callback
  bot.callbackQuery(CALLBACK.PAY_KORAPAY, async (ctx) => {
    await ctx.answerCallbackQuery();
    await handlePayKorapay(ctx);
  });

  // Cancel payment callback
  bot.callbackQuery(CALLBACK.PAY_CANCEL, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("Subscription cancelled.");
  });

  // User has a coupon code — prompt for input
  bot.callbackQuery(CALLBACK.PAYMENT_COUPON_YES, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_payment_coupon";
    await ctx.editMessageText(
      `${EMOJI.COUPONS} <b>Enter your coupon code:</b>\n\n` +
      `Type your coupon code below and send it as a message.`,
      { parse_mode: "HTML" }
    );
  });

  // Skip coupon — proceed directly (also used for "Continue" after coupon accepted)
  bot.callbackQuery(CALLBACK.PAYMENT_COUPON_SKIP, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `${EMOJI.HOURGLASS} Preparing your payment link...`,
      { parse_mode: "HTML" }
    );
    await createBotPaymentAndShowLink(ctx);
  });

  // Retry coupon entry
  bot.callbackQuery(CALLBACK.PAYMENT_COUPON_RETRY, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_payment_coupon";
    await ctx.editMessageText(
      `${EMOJI.COUPONS} <b>Enter your coupon code:</b>`,
      { parse_mode: "HTML" }
    );
  });
}
