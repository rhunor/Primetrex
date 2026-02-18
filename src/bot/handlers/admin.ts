import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { adminPanelKeyboard } from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";

async function showAdminPanel(ctx: BotContext) {
  const admin = await isAdmin(ctx);
  if (!admin) {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery("You are not authorized.");
    } else {
      await ctx.reply("You are not authorized.");
    }
    return;
  }

  const text = `${EMOJI.ADMIN_PANEL} <b>Admin Panel</b>\n\nChoose an action below.`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: adminPanelKeyboard(),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: adminPanelKeyboard(),
    });
  }
}

export function registerAdminHandlers(bot: Bot<BotContext>) {
  // Admin panel callback
  bot.callbackQuery(CALLBACK.ADMIN_PANEL, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showAdminPanel(ctx);
  });

  // Channels (placeholder)
  bot.callbackQuery(CALLBACK.ADMIN_CHANNELS, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `${EMOJI.CHANNELS} <b>Channel Management</b>\n\nManage your connected Telegram channels/groups.\n\n<i>Coming soon.</i>`,
      { parse_mode: "HTML", reply_markup: adminPanelKeyboard() }
    );
  });

  // Payment providers (placeholder)
  bot.callbackQuery(CALLBACK.ADMIN_PAYMENT, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `${EMOJI.PAYMENT_PROVIDERS} <b>Payment Providers</b>\n\n` +
        `Configure payment gateways.\n\n` +
        `Currently active: <b>Flutterwave</b> ${EMOJI.SUCCESS}`,
      { parse_mode: "HTML", reply_markup: adminPanelKeyboard() }
    );
  });
}
