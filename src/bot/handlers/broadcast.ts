import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import {
  broadcastConfirmKeyboard,
  broadcastTargetKeyboard,
  backButton,
} from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import BroadcastLog from "@/models/BroadcastLog";
import Plan from "@/models/Plan";
import { bot as botInstance } from "@/bot/index";

export function registerBroadcastHandlers(bot: Bot<BotContext>) {
  // Start broadcast flow — show target selection
  bot.callbackQuery(CALLBACK.ADMIN_BROADCAST, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;

    ctx.session.step = undefined;
    ctx.session.broadcastTarget = undefined;
    ctx.session.broadcastDMTargetId = undefined;
    ctx.session.pendingBroadcastMessage = undefined;

    await ctx.editMessageText(
      `${EMOJI.BROADCAST} <b>Broadcast</b>\n\n` +
        `Choose where to send your message:`,
      { parse_mode: "HTML", reply_markup: broadcastTargetKeyboard() }
    );
  });

  // Target: All Subscribers
  bot.callbackQuery(CALLBACK.BROADCAST_TARGET_ALL, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;

    ctx.session.broadcastTarget = "all";
    ctx.session.step = "awaiting_broadcast_message";

    await dbConnect();
    const activeCount = await BotSubscriber.countDocuments({ status: "active" });

    await ctx.editMessageText(
      `${EMOJI.BROADCAST} <b>Broadcast to All Subscribers</b>\n\n` +
        `Active subscribers: <b>${activeCount}</b>\n\n` +
        `Type your message below (HTML formatting supported).\n` +
        `Send /cancel to go back.`,
      { parse_mode: "HTML" }
    );
  });

  // Target: Channel/Group
  bot.callbackQuery(CALLBACK.BROADCAST_TARGET_CHANNEL, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;

    ctx.session.broadcastTarget = "channel";
    ctx.session.step = "awaiting_broadcast_message";

    await dbConnect();
    const plan = await Plan.findOne({ isActive: true });
    const channelInfo = plan
      ? `Channel: <b>${plan.channelName}</b> (<code>${plan.channelId}</code>)`
      : "No active channel found — make sure a Plan is configured.";

    await ctx.editMessageText(
      `${EMOJI.CHANNEL_MSG} <b>Send to Channel/Group</b>\n\n` +
        `${channelInfo}\n\n` +
        `Type your message below (HTML formatting supported).\n` +
        `Send /cancel to go back.`,
      { parse_mode: "HTML" }
    );
  });

  // Target: DM Specific User
  bot.callbackQuery(CALLBACK.BROADCAST_TARGET_DM, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;

    ctx.session.broadcastTarget = "dm";
    ctx.session.step = "awaiting_broadcast_dm_user_id";

    await ctx.editMessageText(
      `${EMOJI.DM} <b>DM Specific User</b>\n\n` +
        `Enter the Telegram User ID of the person you want to message.\n\n` +
        `<i>Tip: User IDs appear in the subscriber list.</i>\n\n` +
        `Send /cancel to go back.`,
      { parse_mode: "HTML" }
    );
  });

  // Handle DM target user ID input
  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.step === "awaiting_broadcast_dm_user_id") {
      const text = ctx.message.text.trim();

      if (text === "/cancel") {
        ctx.session.step = undefined;
        const { adminPanelKeyboard } = await import("@/bot/keyboards/inline");
        await ctx.reply(
          `${EMOJI.ADMIN_PANEL} <b>Admin Panel</b>\n\nChoose an action below.`,
          { parse_mode: "HTML", reply_markup: adminPanelKeyboard() }
        );
        return;
      }

      if (!/^\d+$/.test(text)) {
        await ctx.reply("Please enter a valid numeric Telegram User ID.");
        return;
      }

      ctx.session.broadcastDMTargetId = text;
      ctx.session.step = "awaiting_broadcast_dm_message";

      await ctx.reply(
        `${EMOJI.DM} <b>DM to User ${text}</b>\n\n` +
          `Type your message below (HTML formatting supported).\n` +
          `Send /cancel to go back.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    return next();
  });

  // Handle broadcast message text (all targets)
  bot.on("message:text", async (ctx, next) => {
    if (
      ctx.session.step !== "awaiting_broadcast_message" &&
      ctx.session.step !== "awaiting_broadcast_dm_message"
    ) {
      return next();
    }

    const text = ctx.message.text;

    if (text === "/cancel") {
      ctx.session.step = undefined;
      ctx.session.broadcastTarget = undefined;
      ctx.session.broadcastDMTargetId = undefined;
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

    let previewLabel = "";
    if (ctx.session.broadcastTarget === "all") {
      const activeCount = await BotSubscriber.countDocuments({ status: "active" });
      previewLabel = `Send to <b>${activeCount}</b> active subscriber(s)`;
    } else if (ctx.session.broadcastTarget === "channel") {
      const plan = await Plan.findOne({ isActive: true });
      previewLabel = `Post to channel: <b>${plan?.channelName ?? "Unknown"}</b>`;
    } else if (ctx.session.broadcastTarget === "dm") {
      previewLabel = `DM to user <b>${ctx.session.broadcastDMTargetId}</b>`;
    }

    await ctx.reply(
      `${EMOJI.BROADCAST} <b>Preview</b>\n\n` +
        `<i>${text}</i>\n\n` +
        `${previewLabel}\n\n` +
        `Confirm send?`,
      {
        parse_mode: "HTML",
        reply_markup: broadcastConfirmKeyboard(),
      }
    );
  });

  // Confirm and send broadcast
  bot.callbackQuery(CALLBACK.BROADCAST_SEND, async (ctx) => {
    await ctx.answerCallbackQuery("Sending...");

    const message = ctx.session.pendingBroadcastMessage;
    const target = ctx.session.broadcastTarget ?? "all";

    if (!message) {
      await ctx.editMessageText("No message to send. Please start over.");
      return;
    }

    const step = ctx.session.step;
    ctx.session.step = undefined;
    ctx.session.pendingBroadcastMessage = undefined;

    // Guard: only proceed if we were in confirm state
    if (step !== "awaiting_broadcast_confirm") {
      await ctx.editMessageText("Session expired. Please start over.");
      return;
    }

    await dbConnect();

    if (target === "all") {
      const subscribers = await BotSubscriber.find({ status: "active" });
      let successCount = 0;
      let failCount = 0;
      const failedUserIds: string[] = [];
      const failedNames: string[] = [];

      for (const sub of subscribers) {
        try {
          await botInstance.api.sendMessage(Number(sub.userId), message, {
            parse_mode: "HTML",
          });
          successCount++;
        } catch {
          failCount++;
          failedUserIds.push(sub.userId);
          const name = [sub.firstName, sub.lastName].filter(Boolean).join(" ") || sub.userId;
          failedNames.push(name);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      await BroadcastLog.create({
        message,
        target: "all",
        successCount,
        failCount,
        failedUserIds,
      });

      let resultText =
        `${EMOJI.BROADCAST} <b>Broadcast Complete</b>\n\n` +
        `${EMOJI.SUCCESS} Sent: ${successCount}\n` +
        `${EMOJI.CANCEL} Failed: ${failCount}`;

      if (failedNames.length > 0) {
        const list = failedNames.slice(0, 20).join("\n  • ");
        resultText += `\n\n<b>Failed recipients:</b>\n  • ${list}`;
        if (failedNames.length > 20) {
          resultText += `\n  …and ${failedNames.length - 20} more`;
        }
      }

      await ctx.editMessageText(resultText, {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_PANEL),
      });
      return;
    }

    if (target === "channel") {
      const plan = await Plan.findOne({ isActive: true });
      if (!plan) {
        await ctx.editMessageText(
          `${EMOJI.WARNING} No active channel found. Please configure a Plan first.`,
          { parse_mode: "HTML", reply_markup: backButton(CALLBACK.ADMIN_PANEL) }
        );
        return;
      }

      try {
        await botInstance.api.sendMessage(plan.channelId, message, {
          parse_mode: "HTML",
        });

        await BroadcastLog.create({
          message,
          target: "channel",
          channelId: plan.channelId,
          successCount: 1,
          failCount: 0,
          failedUserIds: [],
        });

        await ctx.editMessageText(
          `${EMOJI.SUCCESS} <b>Message posted to ${plan.channelName}</b>`,
          { parse_mode: "HTML", reply_markup: backButton(CALLBACK.ADMIN_PANEL) }
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);

        await BroadcastLog.create({
          message,
          target: "channel",
          channelId: plan.channelId,
          successCount: 0,
          failCount: 1,
          failedUserIds: [plan.channelId],
        });

        await ctx.editMessageText(
          `${EMOJI.CANCEL} <b>Failed to post to channel</b>\n\n` +
            `<code>${errMsg}</code>\n\n` +
            `Make sure the bot is an admin in the channel/group.`,
          { parse_mode: "HTML", reply_markup: backButton(CALLBACK.ADMIN_PANEL) }
        );
      }
      return;
    }

    if (target === "dm") {
      const dmTargetId = ctx.session.broadcastDMTargetId;
      ctx.session.broadcastDMTargetId = undefined;
      ctx.session.broadcastTarget = undefined;

      if (!dmTargetId) {
        await ctx.editMessageText("Target user ID missing. Please start over.");
        return;
      }

      try {
        await botInstance.api.sendMessage(Number(dmTargetId), message, {
          parse_mode: "HTML",
        });

        await BroadcastLog.create({
          message,
          target: "dm",
          dmTargetId,
          successCount: 1,
          failCount: 0,
          failedUserIds: [],
        });

        await ctx.editMessageText(
          `${EMOJI.SUCCESS} <b>Message delivered to user ${dmTargetId}</b>`,
          { parse_mode: "HTML", reply_markup: backButton(CALLBACK.ADMIN_PANEL) }
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);

        await BroadcastLog.create({
          message,
          target: "dm",
          dmTargetId,
          successCount: 0,
          failCount: 1,
          failedUserIds: [dmTargetId],
        });

        await ctx.editMessageText(
          `${EMOJI.CANCEL} <b>Failed to DM user ${dmTargetId}</b>\n\n` +
            `<code>${errMsg}</code>\n\n` +
            `The user may have blocked the bot.`,
          { parse_mode: "HTML", reply_markup: backButton(CALLBACK.ADMIN_PANEL) }
        );
      }
      return;
    }
  });

  // Cancel broadcast
  bot.callbackQuery(CALLBACK.BROADCAST_CANCEL, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = undefined;
    ctx.session.pendingBroadcastMessage = undefined;
    ctx.session.broadcastTarget = undefined;
    ctx.session.broadcastDMTargetId = undefined;

    const { adminPanelKeyboard } = await import("@/bot/keyboards/inline");
    await ctx.editMessageText(
      `${EMOJI.ADMIN_PANEL} <b>Admin Panel</b>\n\nChoose an action below.`,
      { parse_mode: "HTML", reply_markup: adminPanelKeyboard() }
    );
  });
}
