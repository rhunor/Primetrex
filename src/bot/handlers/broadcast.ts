import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { broadcastConfirmKeyboard, backButton } from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import { bot as botInstance } from "@/bot/index";

export function registerBroadcastHandlers(bot: Bot<BotContext>) {
  // Start broadcast flow
  bot.callbackQuery(CALLBACK.ADMIN_BROADCAST, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;

    ctx.session.step = "awaiting_broadcast_message";

    await ctx.editMessageText(
      `${EMOJI.BROADCAST} <b>Broadcast Message</b>\n\n` +
        `Send a message to all active subscribers.\n\n` +
        `Type your message below or send media (photo, video, document).\n\n` +
        `Send /cancel to go back.`,
      { parse_mode: "HTML" }
    );
  });

  // Handle broadcast message text
  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.step !== "awaiting_broadcast_message") {
      return next();
    }

    const text = ctx.message.text;

    if (text === "/cancel") {
      ctx.session.step = undefined;
      const { adminPanelKeyboard } = await import("@/bot/keyboards/inline");
      await ctx.reply(
        `${EMOJI.ADMIN_PANEL} <b>Admin Panel</b>\n\nChoose an action below.`,
        { parse_mode: "HTML", reply_markup: adminPanelKeyboard() }
      );
      return;
    }

    ctx.session.pendingBroadcastMessage = text;
    ctx.session.step = "awaiting_broadcast_confirm";

    await dbConnect();
    const activeCount = await BotSubscriber.countDocuments({ status: "active" });

    await ctx.reply(
      `${EMOJI.BROADCAST} <b>Broadcast Preview</b>\n\n` +
        `"${text}"\n\n` +
        `Send to <b>${activeCount}</b> active subscribers?`,
      {
        parse_mode: "HTML",
        reply_markup: broadcastConfirmKeyboard(),
      }
    );
  });

  // Confirm and send broadcast
  bot.callbackQuery(CALLBACK.BROADCAST_SEND, async (ctx) => {
    await ctx.answerCallbackQuery("Sending broadcast...");

    const message = ctx.session.pendingBroadcastMessage;
    if (!message) {
      await ctx.editMessageText("No message to broadcast. Please start over.");
      return;
    }

    ctx.session.step = undefined;
    ctx.session.pendingBroadcastMessage = undefined;

    await dbConnect();
    const subscribers = await BotSubscriber.find({ status: "active" });

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscribers) {
      try {
        await botInstance.api.sendMessage(Number(sub.userId), message, {
          parse_mode: "HTML",
        });
        successCount++;
      } catch {
        failCount++;
      }
      // Rate limiting: 50ms delay between messages
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await ctx.editMessageText(
      `${EMOJI.BROADCAST} <b>Broadcast Complete</b>\n\n` +
        `${EMOJI.SUCCESS} Sent: ${successCount}\n` +
        `${EMOJI.CANCEL} Failed: ${failCount}`,
      {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_PANEL),
      }
    );
  });

  // Cancel broadcast
  bot.callbackQuery(CALLBACK.BROADCAST_CANCEL, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = undefined;
    ctx.session.pendingBroadcastMessage = undefined;

    const { adminPanelKeyboard } = await import("@/bot/keyboards/inline");
    await ctx.editMessageText(
      `${EMOJI.ADMIN_PANEL} <b>Admin Panel</b>\n\nChoose an action below.`,
      { parse_mode: "HTML", reply_markup: adminPanelKeyboard() }
    );
  });
}
