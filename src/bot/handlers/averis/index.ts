import { InlineKeyboard } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { mainMenuKeyboard } from "@/bot/keyboards/inline";
import { getAverisStatus, generateAverisInviteLink } from "@/bot/services/averis/groupManager";

const AVERIS_APP_URL = process.env.AVERIS_APP_URL || "https://app.averisacademy.com";

async function showAverisStatus(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from!.id.toString();
  const status = await getAverisStatus(telegramId);
  const hasSubscription = !!(status?.isSubscribed);

  let text: string;
  if (!hasSubscription) {
    text =
      `\u{1F534} <b>No Active Averis Academy Subscription</b>\n\n` +
      `You don't have an active subscription linked to this Telegram account.\n\n` +
      `If you've already paid, use the link in your welcome email to connect your account.\n\n` +
      `To get started, purchase a subscription via an affiliate link on the Averis Academy website.`;
  } else {
    const expiryStr = status!.expiryDate!.toLocaleDateString("en-NG", {
      day: "numeric", month: "long", year: "numeric",
    });
    const daysLeft = status!.daysLeft!;
    const urgency = daysLeft <= 3 ? "\u{1F534}" : daysLeft <= 15 ? "⚠️" : "\u{1F7E2}";

    text =
      `${urgency} <b>Averis Academy Subscription</b>\n\n` +
      `Hi <b>${status!.firstName}</b>!\n\n` +
      `Status: <b>Active</b>\n` +
      `Expires: <b>${expiryStr}</b>\n` +
      `Days remaining: <b>${daysLeft} day${daysLeft === 1 ? "" : "s"}</b>\n\n` +
      (daysLeft <= 30
        ? `\u{1F4B3} Your subscription expires soon. Renew for ₦30,000 to keep your access and commissions.`
        : `Keep sharing your referral link to earn 50% on every sale!`);
  }

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: mainMenuKeyboard(hasSubscription),
  });
}

async function handleAverisRenew(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from!.id.toString();
  const status = await getAverisStatus(telegramId);

  if (!status?.isSubscribed) {
    await ctx.editMessageText(
      `\u{1F534} <b>No subscription found to renew.</b>\n\nPlease check your subscription status first.`,
      { parse_mode: "HTML", reply_markup: mainMenuKeyboard(false) }
    );
    return;
  }

  const expiryStr = status.expiryDate!.toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  await ctx.editMessageText(
    `\u{1F504} <b>Renew Your Averis Academy Subscription</b>\n\n` +
      `Current expiry: <b>${expiryStr}</b>\n` +
      `Renewal price: <b>₦30,000</b> for another 6 months\n\n` +
      `Tap the button below to complete your renewal on the Averis Academy website. ` +
      `Your subscription will extend automatically after payment is confirmed.\n\n` +
      `Your referrer will also receive their renewal commission once the payment settles.`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard()
        .url("\u{1F4B3} Renew Now — \u{20A6}30,000", `${AVERIS_APP_URL}/dashboard/subscription`)
        .row()
        .text(`${EMOJI.BACK} Back`, CALLBACK.MAIN_MENU),
    }
  );
}

async function handleAverisReinvite(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from!.id.toString();
  const status = await getAverisStatus(telegramId);

  if (!status || !status.isSubscribed) {
    await ctx.editMessageText(
      `\u{1F534} <b>No active subscription found.</b>\n\nYou need an active subscription to get a community invite link.`,
      { parse_mode: "HTML", reply_markup: mainMenuKeyboard(false) }
    );
    return;
  }

  try {
    const link = await generateAverisInviteLink();
    await ctx.editMessageText(
      `\u{1F517} <b>Your Averis Academy Community Invite</b>\n\n` +
        `Join here: ${link}\n\n` +
        `⚠️ This link is single-use. Join immediately!`,
      { parse_mode: "HTML", reply_markup: mainMenuKeyboard(true) }
    );
  } catch {
    await ctx.editMessageText(
      `${EMOJI.WARNING} Could not generate invite link. Please try again or contact support.`,
      { parse_mode: "HTML", reply_markup: mainMenuKeyboard(true) }
    );
  }
}

export function registerAverisHandlers(bot: import("grammy").Bot<BotContext>) {
  bot.callbackQuery(CALLBACK.AVERIS_STATUS, showAverisStatus);
  bot.callbackQuery(CALLBACK.AVERIS_RENEW, handleAverisRenew);
  bot.callbackQuery(CALLBACK.AVERIS_REINVITE, handleAverisReinvite);
}
