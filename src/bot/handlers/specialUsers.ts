import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK, PAGE_SIZE } from "@/bot/constants";
import {
  specialUsersKeyboard,
  discountTypeKeyboard,
  backButton,
} from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import SpecialUser from "@/models/SpecialUser";
import SpecialConfig from "@/models/SpecialConfig";
import BotSubscriber from "@/models/BotSubscriber";
import Plan from "@/models/Plan";

function formatNaira(amount: number): string {
  return `\u20A6${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

async function showSpecialUsersMenu(ctx: BotContext) {
  await dbConnect();

  const count = await SpecialUser.countDocuments();
  let config = await SpecialConfig.findOne();
  if (!config) {
    config = await SpecialConfig.create({
      discountType: "fixed",
      discountValue: 5000,
    });
  }

  const discountStr =
    config.discountType === "fixed"
      ? `${formatNaira(config.discountValue)} (fixed)`
      : `${config.discountValue}% (percentage)`;

  const text =
    `${EMOJI.SPECIAL_SUBSCRIBERS} <b>Special Users Management</b>\n\n` +
    `Whitelisted users get an automatic discount on all plans.\n\n` +
    `${EMOJI.SUBSCRIBERS} Total Users: ${count}\n` +
    `${EMOJI.GIFT} Current Discount: ${discountStr}`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: specialUsersKeyboard(),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: specialUsersKeyboard(),
    });
  }
}

export function registerSpecialUserHandlers(bot: Bot<BotContext>) {
  // Show special users menu
  bot.callbackQuery(CALLBACK.ADMIN_SPECIAL, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;
    await showSpecialUsersMenu(ctx);
  });

  // Back to special users menu
  bot.callbackQuery(CALLBACK.SPECIAL_BACK, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showSpecialUsersMenu(ctx);
  });

  // List special users
  bot.callbackQuery(CALLBACK.SPECIAL_LIST, async (ctx) => {
    await ctx.answerCallbackQuery();
    await dbConnect();

    const users = await SpecialUser.find().limit(PAGE_SIZE * 2);

    if (users.length === 0) {
      await ctx.editMessageText(
        `${EMOJI.SPECIAL_SUBSCRIBERS} <b>Special Users</b>\n\nNo special users found.`,
        {
          parse_mode: "HTML",
          reply_markup: backButton(CALLBACK.ADMIN_SPECIAL),
        }
      );
      return;
    }

    const entries = users.map((u, i) => {
      const name = u.username
        ? `@${u.username}`
        : u.firstName || "Unknown";
      return `${i + 1}. ${name} (${u.userId})`;
    });

    await ctx.editMessageText(
      `${EMOJI.SPECIAL_SUBSCRIBERS} <b>Special Users</b>\n\n` +
        entries.join("\n"),
      {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_SPECIAL),
      }
    );
  });

  // Add special user
  bot.callbackQuery(CALLBACK.SPECIAL_ADD, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_special_user_id";

    await ctx.editMessageText(
      `${EMOJI.PERSON} <b>Enter User ID</b>\n\n` +
        `Please enter the numeric Telegram User ID:`,
      {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_SPECIAL),
      }
    );
  });

  // Config discount
  bot.callbackQuery(CALLBACK.SPECIAL_CONFIG, async (ctx) => {
    await ctx.answerCallbackQuery();
    await dbConnect();

    let config = await SpecialConfig.findOne();
    if (!config) {
      config = await SpecialConfig.create({
        discountType: "fixed",
        discountValue: 5000,
      });
    }

    const discountStr =
      config.discountType === "fixed"
        ? formatNaira(config.discountValue)
        : `${config.discountValue}%`;

    await ctx.editMessageText(
      `${EMOJI.CONFIG} <b>Configure Discount</b>\n\n` +
        `Current: ${discountStr} (${config.discountType})\n\n` +
        `Choose discount type:`,
      {
        parse_mode: "HTML",
        reply_markup: discountTypeKeyboard(),
      }
    );
  });

  // Set discount type to fixed
  bot.callbackQuery(CALLBACK.SPECIAL_DISCOUNT_FIXED, async (ctx) => {
    await ctx.answerCallbackQuery();
    await dbConnect();
    await SpecialConfig.updateOne({}, { discountType: "fixed" }, { upsert: true });

    ctx.session.step = "awaiting_discount_value";
    ctx.session.pendingCouponType = "fixed";

    await ctx.editMessageText(
      `Enter the <b>fixed discount amount</b> in Naira (e.g. 5000):`,
      { parse_mode: "HTML" }
    );
  });

  // Set discount type to percentage
  bot.callbackQuery(CALLBACK.SPECIAL_DISCOUNT_PERCENT, async (ctx) => {
    await ctx.answerCallbackQuery();
    await dbConnect();
    await SpecialConfig.updateOne({}, { discountType: "percentage" }, { upsert: true });

    ctx.session.step = "awaiting_discount_value";
    ctx.session.pendingCouponType = "percentage";

    await ctx.editMessageText(
      `Enter the <b>percentage discount</b> (e.g. 10 for 10%):`,
      { parse_mode: "HTML" }
    );
  });

  // Handle text inputs for special user flows
  bot.on("message:text", async (ctx, next) => {
    const { step } = ctx.session;

    if (step === "awaiting_special_user_id") {
      const userId = ctx.message.text.trim();
      if (!/^\d+$/.test(userId)) {
        await ctx.reply("Please enter a valid numeric User ID.");
        return;
      }

      await dbConnect();

      // Check duplicate
      const existing = await SpecialUser.findOne({ userId });
      if (existing) {
        ctx.session.step = undefined;
        await ctx.reply(
          `${EMOJI.BLOCKED} <b>Action Blocked</b>\n\n` +
            `User ${userId} already exists in the whitelist.\n\n` +
            `<b>Duplicates are not allowed.</b>\nPlease click Back to return.`,
          {
            parse_mode: "HTML",
            reply_markup: backButton(CALLBACK.ADMIN_SPECIAL),
          }
        );
        return;
      }

      ctx.session.pendingUserId = parseInt(userId);
      ctx.session.step = "awaiting_special_expiry";

      await ctx.reply(
        `${EMOJI.CALENDAR} <b>Expiry Date</b>\n\n` +
          `Enter expiry (YYYY-MM-DD):\n` +
          `Tip: Type 'skip' to use Plan Duration.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    if (step === "awaiting_special_expiry") {
      const input = ctx.message.text.trim().toLowerCase();
      const userId = ctx.session.pendingUserId!;
      ctx.session.step = undefined;

      await dbConnect();

      // Get user info from Telegram
      let username: string | null = null;
      let firstName: string | null = null;
      let lastName: string | null = null;
      try {
        const chat = await ctx.api.getChat(userId);
        if ("username" in chat) username = chat.username || null;
        if ("first_name" in chat) firstName = chat.first_name || null;
        if ("last_name" in chat) lastName = (chat as { last_name?: string }).last_name || null;
      } catch {
        // Can't fetch
      }

      // Add to special users
      await SpecialUser.create({
        userId: userId.toString(),
        username,
        firstName,
        lastName,
      });

      // Also create a subscription if plan exists
      const plan = await Plan.findOne({ isActive: true });
      let hasActiveSub = false;

      if (plan) {
        const now = new Date();
        let expiryDate: Date;

        if (input === "skip") {
          expiryDate = new Date(
            now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
          );
        } else {
          const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
          const match = input.match(dateRegex);
          if (match) {
            expiryDate = new Date(
              parseInt(match[1]),
              parseInt(match[2]) - 1,
              parseInt(match[3])
            );
          } else {
            expiryDate = new Date(
              now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
            );
          }
        }

        // Check if already has active subscription
        const existingSub = await BotSubscriber.findOne({
          userId: userId.toString(),
          status: "active",
        });

        if (!existingSub) {
          await BotSubscriber.create({
            userId: userId.toString(),
            username,
            firstName,
            lastName,
            planId: plan._id,
            channelId: plan.channelId,
            startDate: now,
            expiryDate,
            status: "active",
            addedBy: "special",
          });
        }
        hasActiveSub = true;
      }

      let text =
        `${EMOJI.SUCCESS} <b>Special User Added!</b>\n` +
        `ID: <code>${userId}</code>\n\n`;

      if (hasActiveSub) {
        text += `User is now whitelisted AND has an active subscription.`;
      } else {
        text += `User is now whitelisted.`;
      }

      await ctx.reply(text, {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_SPECIAL),
      });

      ctx.session.pendingUserId = undefined;
      return;
    }

    if (step === "awaiting_discount_value") {
      const value = parseFloat(ctx.message.text.trim());
      if (isNaN(value) || value <= 0) {
        await ctx.reply("Please enter a valid positive number.");
        return;
      }

      ctx.session.step = undefined;
      await dbConnect();
      await SpecialConfig.updateOne({}, { discountValue: value }, { upsert: true });

      await ctx.reply(
        `${EMOJI.SUCCESS} Discount updated to ${ctx.session.pendingCouponType === "fixed" ? formatNaira(value) : `${value}%`}.`,
        {
          parse_mode: "HTML",
          reply_markup: backButton(CALLBACK.ADMIN_SPECIAL),
        }
      );
      ctx.session.pendingCouponType = undefined;
      return;
    }

    return next();
  });
}
