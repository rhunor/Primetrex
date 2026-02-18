import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { botConfig } from "@/bot/config";
import { backButton } from "@/bot/keyboards/inline";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export function registerAffiliateHandlers(bot: Bot<BotContext>) {
  bot.callbackQuery(CALLBACK.AFFILIATE, async (ctx) => {
    await ctx.answerCallbackQuery();

    const telegramId = ctx.from.id.toString();

    await dbConnect();
    const user = await User.findOne({ telegramId });

    if (!user) {
      const text =
        `${EMOJI.WARNING} <b>Account Not Linked</b>\n\n` +
        `Your Telegram account is not linked to a Primetrex account yet.\n\n` +
        `${EMOJI.ARROW} Visit your dashboard at <b>${botConfig.appUrl}</b> and link your Telegram account to get your affiliate link.`;

      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.MAIN_MENU),
      });
      return;
    }

    const affiliateLink = `${botConfig.appUrl}/register?ref=${user.referralCode}`;

    const text =
      `${EMOJI.AFFILIATE} <b>Your Affiliate Link</b>\n\n` +
      `Share this link to earn commissions when people sign up:\n\n` +
      `<code>${affiliateLink}</code>\n\n` +
      `${EMOJI.TIP} <i>Tap the link above to copy it!</i>\n\n` +
      `${EMOJI.MONEY} <b>Earn up to 50%</b> commission on direct referrals\n` +
      `${EMOJI.CHART} <b>Earn 10%</b> from your referrals' referrals`;

    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: backButton(CALLBACK.MAIN_MENU),
    });
  });
}
