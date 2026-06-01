import { InlineKeyboard } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { getAverisStatus } from "@/bot/services/averis/groupManager";
import { generateAverisInviteLink } from "@/bot/services/averis/groupManager";

const AVERIS_APP_URL = process.env.AVERIS_APP_URL || "https://app.averisacademy.com";

function averisMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .url("🌐 Averis Academy Dashboard", `${AVERIS_APP_URL}/dashboard`)
    .row()
    .text("📊 My Subscription Status", CALLBACK.AVERIS_STATUS)
    .row()
    .text("🔗 Get My Invite Link Again", CALLBACK.AVERIS_REINVITE)
    .row()
    .text(`${EMOJI.BACK} Back to Main Menu`, CALLBACK.MAIN_MENU);
}

async function showAverisMenu(ctx: BotContext) {
  const text =
    `\u{1F393} <b>Averis Academy</b>\n\n` +
    `Nigeria's #1 affiliate learning platform.\n\n` +
    `\u{1F4B0} <b>Earn 50% commission</b> on every subscription sale\n` +
    `\u{1F4C5} New subscription: <b>₦35,000</b> / 6 months\n` +
    `\u{1F504} Renewal: <b>₦30,000</b> / 6 months\n\n` +
    `Already subscribed? Check your status or get your community invite link below.`;

  const kb = averisMenuKeyboard();

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
  } else {
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  }
}

async function showAverisStatus(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from!.id.toString();
  const status = await getAverisStatus(telegramId);

  let text: string;
  if (!status || !status.isSubscribed) {
    text =
      `\u{1F534} <b>No Active Averis Academy Subscription</b>\n\n` +
      `You don't have an active subscription linked to this Telegram account.\n\n` +
      `If you've already paid, use the link in your welcome email to connect your account.\n\n` +
      `To get started, visit the Averis Academy website and purchase a subscription via an affiliate link.`;
  } else {
    const expiryStr = status.expiryDate!.toLocaleDateString("en-NG", {
      day: "numeric", month: "long", year: "numeric",
    });
    const daysLeft = status.daysLeft!;
    const urgency = daysLeft <= 3 ? "\u{1F534}" : daysLeft <= 15 ? "⚠️" : "\u{1F7E2}";

    text =
      `${urgency} <b>Averis Academy Subscription</b>\n\n` +
      `Hi <b>${status.firstName}</b>!\n\n` +
      `Status: <b>Active</b>\n` +
      `Expires: <b>${expiryStr}</b>\n` +
      `Days remaining: <b>${daysLeft} day${daysLeft === 1 ? "" : "s"}</b>\n\n` +
      (daysLeft <= 30
        ? `\u{1F4B3} Renewal is ₦30,000 for another 6 months — <a href="${AVERIS_APP_URL}/dashboard/subscription">renew here</a>.`
        : `Keep sharing your referral link to earn 50% on every sale!`);
  }

  await ctx.editMessageText(text, {
    parse_mode: "HTML",
    reply_markup: averisMenuKeyboard(),
  });
}

async function handleAverisReinvite(ctx: BotContext) {
  await ctx.answerCallbackQuery();
  const telegramId = ctx.from!.id.toString();
  const status = await getAverisStatus(telegramId);

  if (!status || !status.isSubscribed) {
    await ctx.editMessageText(
      `\u{1F534} <b>No active subscription found.</b>\n\nYou need an active Averis Academy subscription to get an invite link.`,
      { parse_mode: "HTML", reply_markup: averisMenuKeyboard() }
    );
    return;
  }

  try {
    const link = await generateAverisInviteLink();
    await ctx.editMessageText(
      `\u{1F517} <b>Your Averis Academy Community Invite</b>\n\n` +
        `Join here: ${link}\n\n` +
        `⚠️ This link is single-use. Join immediately!`,
      { parse_mode: "HTML", reply_markup: averisMenuKeyboard() }
    );
  } catch {
    await ctx.editMessageText(
      `${EMOJI.WARNING} Failed to generate invite link. Please try again or contact support.`,
      { parse_mode: "HTML", reply_markup: averisMenuKeyboard() }
    );
  }
}

export function registerAverisHandlers(bot: import("grammy").Bot<BotContext>) {
  // "Averis Academy" button from main menu
  bot.callbackQuery(CALLBACK.AVERIS_MENU, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showAverisMenu(ctx);
  });

  // Check subscription status
  bot.callbackQuery(CALLBACK.AVERIS_STATUS, showAverisStatus);

  // Re-generate invite link
  bot.callbackQuery(CALLBACK.AVERIS_REINVITE, handleAverisReinvite);
}
