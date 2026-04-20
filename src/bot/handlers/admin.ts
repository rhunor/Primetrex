import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { adminPanelKeyboard, backButton } from "@/bot/keyboards/inline";
import { InlineKeyboard } from "grammy";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import Plan from "@/models/Plan";
import BotSubscriber from "@/models/BotSubscriber";
import { triggerAddAllUsers, triggerSendLegacyInvites } from "@/bot/services/adminJobs";

function formatNaira(amount: number): string {
  return `\u20A6${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function channelEditKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${EMOJI.CHANNELS} Edit Channel ID`, CALLBACK.ADMIN_CH_EDIT_ID)
    .row()
    .text(`\u270F\uFE0F Edit Channel Name`, CALLBACK.ADMIN_CH_EDIT_NAME)
    .row()
    .text(`${EMOJI.MONEY} Edit Price`, CALLBACK.ADMIN_CH_EDIT_PRICE)
    .row()
    .text(`${EMOJI.RENEW} Edit Renewal Price`, CALLBACK.ADMIN_CH_EDIT_RENEWAL)
    .row()
    .text(`${EMOJI.BACK} Back to Panel`, CALLBACK.ADMIN_PANEL);
}

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

  // Channels management
  bot.callbackQuery(CALLBACK.ADMIN_CHANNELS, async (ctx) => {
    await ctx.answerCallbackQuery();
    await dbConnect();

    const plan = await Plan.findOne({ isActive: true });

    if (!plan) {
      await ctx.editMessageText(
        `${EMOJI.CHANNELS} <b>Channel Management</b>\n\n` +
          `${EMOJI.WARNING} No active plan found. Please seed a plan first.`,
        { parse_mode: "HTML", reply_markup: backButton(CALLBACK.ADMIN_PANEL) }
      );
      return;
    }

    await ctx.editMessageText(
      `${EMOJI.CHANNELS} <b>Channel Management</b>\n\n` +
        `<b>Plan:</b> ${plan.name}\n` +
        `<b>Channel Name:</b> ${plan.channelName}\n` +
        `<b>Channel ID:</b> <code>${plan.channelId}</code>\n` +
        `<b>Price:</b> ${formatNaira(plan.price)}\n` +
        `<b>Renewal Price:</b> ${formatNaira(plan.renewalPrice)}\n` +
        `<b>Duration:</b> ${plan.durationDays} days\n\n` +
        `Select an option to edit:`,
      { parse_mode: "HTML", reply_markup: channelEditKeyboard() }
    );
  });

  // Edit channel ID
  bot.callbackQuery(CALLBACK.ADMIN_CH_EDIT_ID, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_channel_id";
    await ctx.editMessageText(
      `${EMOJI.CHANNELS} <b>Edit Channel ID</b>\n\n` +
        `Send the new Telegram channel ID.\n` +
        `(It should be a negative number like <code>-1001234567890</code>)`,
      { parse_mode: "HTML" }
    );
  });

  // Edit channel name
  bot.callbackQuery(CALLBACK.ADMIN_CH_EDIT_NAME, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_channel_name";
    await ctx.editMessageText(
      `\u270F\uFE0F <b>Edit Channel Name</b>\n\nSend the new channel display name:`,
      { parse_mode: "HTML" }
    );
  });

  // Edit price
  bot.callbackQuery(CALLBACK.ADMIN_CH_EDIT_PRICE, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_plan_price";
    await ctx.editMessageText(
      `${EMOJI.MONEY} <b>Edit Subscription Price</b>\n\nSend the new price in Naira (numbers only, e.g. <code>50000</code>):`,
      { parse_mode: "HTML" }
    );
  });

  // Edit renewal price
  bot.callbackQuery(CALLBACK.ADMIN_CH_EDIT_RENEWAL, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_renewal_price";
    await ctx.editMessageText(
      `${EMOJI.RENEW} <b>Edit Renewal Price</b>\n\nSend the new renewal price in Naira (numbers only, e.g. <code>35000</code>):`,
      { parse_mode: "HTML" }
    );
  });

  // Handle text input for channel edits
  bot.on("message:text", async (ctx, next) => {
    if (ctx.chat.type !== "private") return next();
    const step = ctx.session.step;
    const channelSteps = [
      "awaiting_channel_id",
      "awaiting_channel_name",
      "awaiting_plan_price",
      "awaiting_renewal_price",
    ];

    if (!channelSteps.includes(step ?? "")) return next();

    ctx.session.step = undefined;
    const input = ctx.message.text.trim();

    await dbConnect();
    const plan = await Plan.findOne({ isActive: true });

    if (!plan) {
      await ctx.reply(`${EMOJI.WARNING} No active plan found.`);
      return;
    }

    try {
      if (step === "awaiting_channel_id") {
        await Plan.updateOne({ _id: plan._id }, { channelId: input });
        await ctx.reply(
          `${EMOJI.SUCCESS} Channel ID updated to <code>${input}</code>.\n\nMake sure the bot is an admin in that channel!`,
          { parse_mode: "HTML" }
        );
      } else if (step === "awaiting_channel_name") {
        await Plan.updateOne({ _id: plan._id }, { channelName: input });
        await ctx.reply(
          `${EMOJI.SUCCESS} Channel name updated to <b>${input}</b>.`,
          { parse_mode: "HTML" }
        );
      } else if (step === "awaiting_plan_price") {
        const price = parseFloat(input.replace(/[^0-9.]/g, ""));
        if (isNaN(price) || price <= 0) {
          await ctx.reply(`${EMOJI.CANCEL} Invalid price. Please enter a valid number.`);
          return;
        }
        await Plan.updateOne({ _id: plan._id }, { price });
        await ctx.reply(
          `${EMOJI.SUCCESS} Subscription price updated to ${formatNaira(price)}.`,
          { parse_mode: "HTML" }
        );
      } else if (step === "awaiting_renewal_price") {
        const price = parseFloat(input.replace(/[^0-9.]/g, ""));
        if (isNaN(price) || price <= 0) {
          await ctx.reply(`${EMOJI.CANCEL} Invalid price. Please enter a valid number.`);
          return;
        }
        await Plan.updateOne({ _id: plan._id }, { renewalPrice: price });
        await ctx.reply(
          `${EMOJI.SUCCESS} Renewal price updated to ${formatNaira(price)}.`,
          { parse_mode: "HTML" }
        );
      }
    } catch (error) {
      console.error("Channel update error:", error);
      await ctx.reply(`${EMOJI.CANCEL} Failed to update. Please try again.`);
    }
  });

  // /addallusers command — send invite links to all active subscribers for all channels
  bot.command("addallusers", async (ctx) => {
    const admin = await isAdmin(ctx);
    if (!admin) {
      await ctx.reply("You are not authorized.");
      return;
    }
    const msg = await ctx.reply(
      `${EMOJI.HOURGLASS} Sending invite links to all active subscribers for all channels...`
    );
    triggerAddAllUsers(ctx.chat.id, msg.message_id);
  });

  // /checkjoined command — check who hasn't joined new channels and reset their inviteSentAt
  bot.command("checkjoined", async (ctx) => {
    const admin = await isAdmin(ctx);
    if (!admin) {
      await ctx.reply("You are not authorized.");
      return;
    }
    const msg = await ctx.reply(
      `${EMOJI.HOURGLASS} Checking channel membership for all active subscribers...`
    );
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    fetch(`${appUrl}/api/admin/bot-checkjoined`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
      },
      body: JSON.stringify({ chatId: ctx.chat.id, messageId: msg.message_id }),
    }).then(async (res) => {
      if (!res.ok) console.error(`checkjoined fetch failed: ${res.status} ${await res.text()}`);
    }).catch((err) => console.error("checkjoined fetch error:", err));
  });

  // /cleanup command — remove all expired subscribers from channel
  bot.command("cleanup", async (ctx) => {
    const admin = await isAdmin(ctx);
    if (!admin) {
      await ctx.reply("You are not authorized.");
      return;
    }
    const msg = await ctx.reply(
      `${EMOJI.HOURGLASS} Running cleanup — removing expired subscribers from channel...`
    );
    // Fire-and-forget to a separate API endpoint to avoid webhook 10s timeout
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    fetch(`${appUrl}/api/admin/bot-cleanup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
      },
      body: JSON.stringify({ chatId: ctx.chat.id, messageId: msg.message_id }),
    }).then(async (res) => {
      if (!res.ok) console.error(`cleanup fetch failed: ${res.status} ${await res.text()}`);
    }).catch((err) => console.error("Cleanup fetch error:", err));
  });

  // /removedlast20 — show who left or was removed from the legacy group in the last 20 days
  bot.command("removedlast20", async (ctx) => {
    const admin = await isAdmin(ctx);
    if (!admin) { await ctx.reply("You are not authorized."); return; }

    const msg = await ctx.reply(`${EMOJI.HOURGLASS} Checking legacy group membership for all subscribers...`);

    await dbConnect();
    const since = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const allUserIds = await BotSubscriber.distinct("userId");
    const total = allUserIds.length;

    const kicked: string[] = [];
    const leftVoluntarily: string[] = [];
    const inGroup: string[] = [];

    for (let i = 0; i < allUserIds.length; i++) {
      const userId = allUserIds[i];
      try {
        const member = await ctx.api.getChatMember(Number("-1003699209692"), Number(userId));
        if (member.status === "member" || member.status === "administrator" || member.status === "creator") {
          inGroup.push(userId);
        } else if (member.status === "left") {
          leftVoluntarily.push(userId);
        } else if (member.status === "kicked" || member.status === "restricted") {
          kicked.push(userId);
        }
      } catch {
        // can't determine
      }

      if ((i + 1) % 20 === 0) {
        try {
          await ctx.api.editMessageText(
            ctx.chat.id,
            msg.message_id,
            `${EMOJI.HOURGLASS} Checking... <b>${i + 1}/${total}</b>`,
            { parse_mode: "HTML" }
          );
        } catch { /* non-critical */ }
      }
    }

    // Also check DB for recent bot-triggered removals (subscription expiry) in last 20 days
    const recentExpired = await BotSubscriber.find({
      status: "expired",
      updatedAt: { $gte: since },
      channelId: { $ne: "-1003699209692" },
    }).lean();
    const recentExpiredIds = [...new Set(recentExpired.map((s) => s.userId))];

    let summary = `${EMOJI.PERSON} <b>Legacy Group Report (${total} total subscribers)</b>\n\n`;
    summary += `✅ Currently in group: <b>${inGroup.length}</b>\n`;
    summary += `🚶 Left voluntarily: <b>${leftVoluntarily.length}</b>\n`;
    summary += `🚫 Removed/kicked: <b>${kicked.length}</b>\n\n`;

    if (leftVoluntarily.length > 0) {
      summary += `<b>🚶 Left voluntarily (${leftVoluntarily.length}):</b>\n`;
      summary += leftVoluntarily.map((id, i) => `${i + 1}. <code>${id}</code>`).join("\n") + "\n\n";
    }

    if (kicked.length > 0) {
      summary += `<b>🚫 Removed/kicked (${kicked.length}):</b>\n`;
      summary += kicked.map((id, i) => `${i + 1}. <code>${id}</code>`).join("\n") + "\n\n";
    }

    summary += `<b>📋 Subscription expiries (last 20 days): ${recentExpiredIds.length}</b>\n`;
    if (recentExpiredIds.length > 0) {
      summary += recentExpiredIds.map((id, i) => `${i + 1}. <code>${id}</code>`).join("\n") + "\n\n";
    }

    summary += `\nRun <b>/sendlegacyinvites</b> to send invite links to everyone not in the group.`;

    // Split if too long for one message
    if (summary.length > 4000) {
      const chunks = summary.match(/[\s\S]{1,4000}/g) || [];
      await ctx.api.editMessageText(ctx.chat.id, msg.message_id, chunks[0] ?? summary, { parse_mode: "HTML" });
      for (let c = 1; c < chunks.length; c++) {
        await ctx.reply(chunks[c], { parse_mode: "HTML" });
      }
    } else {
      await bot.api.editMessageText(ctx.chat.id, msg.message_id, summary, { parse_mode: "HTML" });
    }
  });

  // /sendlegacyinvites — send legacy channel invite to all subscribers not currently in the group
  bot.command("sendlegacyinvites", async (ctx) => {
    const admin = await isAdmin(ctx);
    if (!admin) { await ctx.reply("You are not authorized."); return; }

    const msg = await ctx.reply(`${EMOJI.HOURGLASS} Starting legacy invite job...`);
    triggerSendLegacyInvites(ctx.chat.id, msg.message_id);
  });

  // Payment providers
  bot.callbackQuery(CALLBACK.ADMIN_PAYMENT, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      `${EMOJI.PAYMENT_PROVIDERS} <b>Payment Providers</b>\n\n` +
        `Configure payment gateways.\n\n` +
        `Currently active: <b>Korapay</b> ${EMOJI.SUCCESS}`,
      { parse_mode: "HTML", reply_markup: backButton(CALLBACK.ADMIN_PANEL) }
    );
  });
}
