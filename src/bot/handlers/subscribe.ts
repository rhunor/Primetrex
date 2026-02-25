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
} from "@/bot/services/flutterwave";

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

  const text =
    `${EMOJI.SUBSCRIBE} <b>Subscription Summary</b>\n` +
    `Plan: <b>${planLabel}</b>\n` +
    `Channel: ${plan.channelName}\n` +
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

  price = Math.max(price, 0);

  const txRef = generateTxRef(userId);
  const referralCode = ctx.session.pendingReferralCode ?? null;

  // Clear session referral fields after reading
  ctx.session.pendingReferralCode = undefined;
  ctx.session.pendingIsRenewal = undefined;

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
      `Plan: ${plan.channelName}\n` +
      `Amount: <b>${formatNaira(price)}</b>\n\n` +
      `Click below to pay with Flutterwave.`;

    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: paymentReadyKeyboard(paymentUrl, formatNaira(price)),
    });
  } catch (error) {
    console.error("Flutterwave payment link error:", error);
    await ctx.reply(
      `${EMOJI.CANCEL} Failed to generate payment link. Please try again later.`
    );
  }
}

async function handlePayFlutterwave(ctx: BotContext) {
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
    // Renewals skip the referral code step
    await ctx.editMessageText(
      `${EMOJI.HOURGLASS} Preparing your payment link...`,
      { parse_mode: "HTML" }
    );
    await createBotPaymentAndShowLink(ctx);
    return;
  }

  // New subscription: ask for referral code first
  ctx.session.step = "awaiting_referral_code";

  await ctx.editMessageText(
    `${EMOJI.AFFILIATE} <b>Referral Code</b>\n\n` +
      `Were you referred by a Primetrex affiliate?\n\n` +
      `Type their <b>referral code</b> to credit them, or type <code>skip</code> to continue without one.`,
    { parse_mode: "HTML" }
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

  // Pay with Flutterwave callback
  bot.callbackQuery(CALLBACK.PAY_FLUTTERWAVE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await handlePayFlutterwave(ctx);
  });

  // Cancel payment callback
  bot.callbackQuery(CALLBACK.PAY_CANCEL, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("Subscription cancelled.");
  });
}
