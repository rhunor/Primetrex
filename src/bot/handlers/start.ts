import { Keyboard, InlineKeyboard } from "grammy";
import { botConfig } from "@/bot/config";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { mainMenuKeyboard, helpKeyboard } from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import { showSubscriptionSummary } from "@/bot/handlers/subscribe";
import { activateSubscription } from "@/bot/services/subscription";
import { verifyPayment } from "@/bot/services/korapay";
import { generateInviteLink } from "@/bot/services/invite";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Plan from "@/models/Plan";
import BotPayment from "@/models/BotPayment";
import BotSubscriber from "@/models/BotSubscriber";
import Transaction from "@/models/Transaction";
import { notifyCommissionEarned } from "@/lib/notifications";
import { siteConfig } from "@/config/site";

const replyKeyboard = new Keyboard()
  .text("\u2261 Main Menu")
  .text(`${EMOJI.SUBSCRIBE} Subscribe`)
  .resized()
  .persistent();

async function showMainMenu(ctx: BotContext) {
  const firstName = ctx.from?.first_name || "there";
  const admin = await isAdmin(ctx);

  await dbConnect();
  const telegramId = ctx.from?.id.toString();
  const linkedUser = telegramId
    ? await User.findOne({ telegramId, telegramLinked: true }).select("_id").lean()
    : null;
  const isLinked = !!linkedUser;

  const text =
    `${EMOJI.WAVE} Hi <b>${firstName}</b>!\n\n` +
    `Welcome to the official  <b>Primetrex Community Subscription</b> bot.\n\n` +
    `${EMOJI.ROCKET} <b>Get Premium Access</b>\n\n` +
    `Subscribe now to unlock exclusive copy trading from Primetrex\n\n` +
    `${EMOJI.POINT_DOWN} Tap <b>Subscribe</b> below to view available plans.`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(admin, isLinked),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(admin, isLinked),
    });
    await ctx.reply(`${EMOJI.POINT_DOWN} Use the menu below for quick access:`, {
      reply_markup: replyKeyboard,
    });
  }
}

async function showHelp(ctx: BotContext) {
  await dbConnect();
  const plan = await Plan.findOne({ isActive: true });

  const price = plan ? `\u20A6${plan.price.toLocaleString("en-NG")}` : "\u20A650,000";
  const renewalPrice = plan
    ? `\u20A6${plan.renewalPrice.toLocaleString("en-NG")}`
    : "\u20A635,000";
  const planName = plan?.name || "Primetrex";

  const text =
    `${EMOJI.HELP} <b>Help</b>\n\n` +
    `\u2022 Tap subscribe for ${planName} first payment of ${price} if you want to make first payment\n` +
    `\u2022 Tap renew to make a renewal payment of ${renewalPrice} if you want to renew your subscription\n` +
    `\u2022 If you paid already, tap <b>I've Paid</b> to verify.\n\n` +
    `If you have issues, contact the channel admin.`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: helpKeyboard(),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: helpKeyboard(),
    });
  }
}

async function handleStartLink(ctx: BotContext, referralCode: string) {
  await dbConnect();
  const telegramUserId = ctx.from!.id.toString();

  const user = await User.findOne({ referralCode });
  if (!user) {
    await ctx.reply("Invalid link. Please check your referral code and try again.");
    return;
  }

  if (user.telegramLinked && user.telegramId !== telegramUserId) {
    await ctx.reply(
      "This account is already linked to a different Telegram user."
    );
    return;
  }

  user.telegramId = telegramUserId;
  user.telegramLinked = true;
  await user.save();

  const subscribeUrl = `${botConfig.appUrl}/dashboard/bot-subscribe`;
  await ctx.reply(
    `<b>Account Linked Successfully!</b>\n\n` +
      `Name: ${user.firstName} ${user.lastName}\n` +
      `Email: ${user.email}\n\n` +
      `${EMOJI.POINT_DOWN} Tap below to complete your first subscription payment. Your channel invite link will be sent here once payment is confirmed.`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .url(`${EMOJI.LINK} Subscribe on Website`, subscribeUrl),
    }
  );
}

export function registerStartHandlers(bot: import("grammy").Bot<BotContext>) {
  // /start command
  bot.command("start", async (ctx) => {
    const payload = ctx.match;

    if (typeof payload === "string" && payload.startsWith("link_")) {
      await handleStartLink(ctx, payload.replace("link_", ""));
      return;
    }

    // Handle payment success deep link
    if (typeof payload === "string" && payload.startsWith("payment_success_")) {
      const txRef = payload.replace("payment_success_", "");

      await ctx.reply(
        `${EMOJI.HOURGLASS} <b>Verifying your payment...</b>`,
        { parse_mode: "HTML" }
      );

      try {
        await dbConnect();

        const payment = await BotPayment.findOne({ paymentRef: txRef });

        if (!payment) {
          await ctx.reply(
            `${EMOJI.WARNING} <b>Reference Not Found</b>\n\n` +
              `We could not find this payment reference. Please use the ` +
              `"I've Paid" button and enter your transaction reference manually.`,
            { parse_mode: "HTML" }
          );
          return;
        }

        if (payment.status === "successful") {
          // Already activated — send a fresh invite link
          const plan = await Plan.findById(payment.planId);
          if (plan) {
            try {
              const inviteLink = await generateInviteLink(plan.channelId);
              await ctx.reply(
                `${EMOJI.SUCCESS} <b>Subscription Active!</b>\n\n` +
                  `Here is your access link to <b>${plan.channelName}</b>:\n` +
                  `${inviteLink}\n\n` +
                  `${EMOJI.WARNING} <i>This link expires in 24 hours and can only be used once. Join now!</i>`,
                { parse_mode: "HTML" }
              );
            } catch {
              await ctx.reply(
                `${EMOJI.SUCCESS} <b>Your subscription is active!</b>\n\n` +
                  `Please contact the admin to get your invite link.`,
                { parse_mode: "HTML" }
              );
            }
          }
          return;
        }

        // Verify with Korapay
        const result = await verifyPayment(txRef);

        if (!result.status || result.data?.status !== "success") {
          await ctx.reply(
            `${EMOJI.CANCEL} <b>Payment Not Confirmed Yet</b>\n\n` +
              `Your payment may still be processing. Please wait a minute and ` +
              `try again, or use the "I've Paid" button to verify manually.`,
            { parse_mode: "HTML" }
          );
          return;
        }

        // Store the Korapay payment reference
        await BotPayment.updateOne(
          { paymentRef: txRef },
          { flwRef: result.data.payment_reference ?? txRef }
        );

        // Activate: creates BotSubscriber + sends invite link DM
        const activation = await activateSubscription(txRef);

        if (!activation.success) {
          await ctx.reply(
            `${EMOJI.CANCEL} Activation issue: ${activation.message}\n\nPlease contact support.`,
            { parse_mode: "HTML" }
          );
          return;
        }

        // Track commissions
        const paidAmount = payment.amount;
        const webUser = await User.findOne({ telegramId: payment.userId });

        const existingComm = await Transaction.findOne({
          paymentReference: txRef,
          type: "commission",
        });

        if (webUser?.referredBy && !existingComm) {
          const tier1Amount = paidAmount * (siteConfig.commission.subscriptionRate / 100);
          await Transaction.create({
            userId: webUser.referredBy,
            type: "commission",
            amount: tier1Amount,
            tier: 1,
            status: "completed",
            sourceUserId: webUser._id,
            paymentReference: txRef,
            description: `Tier 1 commission from ${webUser.firstName} ${webUser.lastName} (subscription)`,
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
              description: `Tier 2 commission from ${webUser.firstName} ${webUser.lastName} (subscription)`,
            });
            notifyCommissionEarned(
              tier1Referrer.referredBy,
              tier2Amount,
              2,
              `${webUser.firstName} ${webUser.lastName}`
            ).catch(() => {});
          }
        } else if (!webUser && payment.referralCode && !existingComm) {
          const referrer = await User.findOne({ referralCode: payment.referralCode });
          if (referrer) {
            const tier1Amount = paidAmount * (siteConfig.commission.subscriptionRate / 100);
            await Transaction.create({
              userId: referrer._id,
              type: "commission",
              amount: tier1Amount,
              tier: 1,
              status: "completed",
              sourceUserId: null,
              paymentReference: txRef,
              description: `Tier 1 commission from Telegram subscriber (ref: ${payment.referralCode})`,
            });
            notifyCommissionEarned(
              referrer._id,
              tier1Amount,
              1,
              "a Telegram subscriber"
            ).catch(() => {});

            if (referrer.referredBy) {
              const tier2Amount = paidAmount * (siteConfig.commission.tier2Rate / 100);
              await Transaction.create({
                userId: referrer.referredBy,
                type: "commission",
                amount: tier2Amount,
                tier: 2,
                status: "completed",
                sourceUserId: null,
                paymentReference: `${txRef}-t2`,
                description: `Tier 2 commission from Telegram subscriber (ref: ${payment.referralCode})`,
              });
              notifyCommissionEarned(
                referrer.referredBy,
                tier2Amount,
                2,
                "a Telegram subscriber"
              ).catch(() => {});
            }
          }
        }
      } catch (error) {
        console.error("Payment success handler error:", error);
        await ctx.reply(
          `${EMOJI.CANCEL} Something went wrong. Please use the "I've Paid" button to verify your payment.`,
          { parse_mode: "HTML" }
        );
      }
      return;
    }

    if (typeof payload === "string" && payload === "payment_failed") {
      await ctx.reply(
        `${EMOJI.CANCEL} Payment was not completed. Please try again.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    await showMainMenu(ctx);
  });

  // /help command
  bot.command("help", showHelp);

  // /status command
  bot.command("status", async (ctx) => {
    await dbConnect();
    const telegramUserId = ctx.from!.id.toString();
    const user = await User.findOne({ telegramId: telegramUserId });

    if (!user) {
      await ctx.reply(
        "Your Telegram is not linked to any Primetrex account.\n\n" +
          "Visit your dashboard to link your account."
      );
      return;
    }

    const statusText = user.isActive ? "Active" : "Inactive";

    // Retention streak
    const sub = await BotSubscriber.findOne({ userId: telegramUserId }).sort({
      startDate: 1,
    });

    let streakLine = "";
    if (sub) {
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      if (sub.status === "active") {
        const days = Math.floor(
          (now.getTime() - new Date(sub.startDate).getTime()) / msPerDay
        );
        streakLine = `\n${EMOJI.STREAK} Active streak: <b>${days} day${days === 1 ? "" : "s"}</b>`;
      } else {
        const days = Math.floor(
          (new Date(sub.expiryDate).getTime() -
            new Date(sub.startDate).getTime()) /
            msPerDay
        );
        streakLine = `\n${EMOJI.STREAK} Last streak: <b>${days} day${days === 1 ? "" : "s"}</b> (expired)`;
      }
    }

    await ctx.reply(
      `<b>Account Status</b>\n\n` +
        `Name: ${user.firstName} ${user.lastName}\n` +
        `Email: ${user.email}\n` +
        `Status: ${statusText}\n` +
        `Referral Code: <code>${user.referralCode}</code>` +
        streakLine,
      { parse_mode: "HTML" }
    );
  });

  // "Main Menu" text from reply keyboard — regex avoids Android Unicode encoding issues
  bot.hears(/Main Menu/i, showMainMenu);
  bot.hears(/Subscribe/i, async (ctx) => {
    await showSubscriptionSummary(ctx, false);
  });

  // Callback: main_menu
  bot.callbackQuery(CALLBACK.MAIN_MENU, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showMainMenu(ctx);
  });

  // Callback: help
  bot.callbackQuery(CALLBACK.HELP, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showHelp(ctx);
  });

  // Callback: admin_exit (back to main menu from admin)
  bot.callbackQuery(CALLBACK.ADMIN_EXIT, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showMainMenu(ctx);
  });
}
