import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { couponMenuKeyboard, backButton } from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";

function formatNaira(amount: number): string {
  return `\u20A6${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function registerCouponHandlers(bot: Bot<BotContext>) {
  // Coupon menu
  bot.callbackQuery(CALLBACK.ADMIN_COUPONS, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;

    await ctx.editMessageText(
      `${EMOJI.COUPONS} <b>Coupon Management</b>\n\n` +
        `Manage discount coupons for subscribers.`,
      { parse_mode: "HTML", reply_markup: couponMenuKeyboard() }
    );
  });

  // List coupons
  bot.callbackQuery(CALLBACK.COUPON_LIST, async (ctx) => {
    await ctx.answerCallbackQuery();
    await dbConnect();

    const coupons = await Coupon.find({ isActive: true });

    if (coupons.length === 0) {
      await ctx.editMessageText(
        `${EMOJI.COUPONS} <b>Active Coupons</b>\n\nNo active coupons.`,
        {
          parse_mode: "HTML",
          reply_markup: backButton(CALLBACK.ADMIN_COUPONS),
        }
      );
      return;
    }

    const entries = coupons.map((c, i) => {
      const discountStr =
        c.discountType === "fixed"
          ? `${formatNaira(c.discountValue)} off (Fixed)`
          : `${c.discountValue}% off (Percentage)`;
      const usesStr = c.maxUses ? `${c.timesUsed}/${c.maxUses}` : `${c.timesUsed}/\u221E`;
      const expiryStr = c.expiresAt
        ? c.expiresAt.toISOString().split("T")[0]
        : "No expiry";

      return (
        `${i + 1}. <code>${c.code}</code> \u2014 ${discountStr}\n` +
        `   Used: ${usesStr} | Expires: ${expiryStr}`
      );
    });

    await ctx.editMessageText(
      `${EMOJI.COUPONS} <b>Active Coupons</b>\n\n` + entries.join("\n\n"),
      {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_COUPONS),
      }
    );
  });

  // Create coupon flow
  bot.callbackQuery(CALLBACK.COUPON_CREATE, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_coupon_code";

    await ctx.editMessageText(
      `${EMOJI.ADD_SUBSCRIBER} <b>Create Coupon</b>\n\n` +
        `Enter the coupon code:`,
      { parse_mode: "HTML" }
    );
  });

  // Back to coupon menu
  bot.callbackQuery(CALLBACK.COUPON_BACK, async (ctx) => {
    await ctx.answerCallbackQuery();
    const { adminPanelKeyboard } = await import("@/bot/keyboards/inline");
    await ctx.editMessageText(
      `${EMOJI.ADMIN_PANEL} <b>Admin Panel</b>\n\nChoose an action below.`,
      { parse_mode: "HTML", reply_markup: adminPanelKeyboard() }
    );
  });

  // Handle coupon creation text flow
  bot.on("message:text", async (ctx, next) => {
    const { step } = ctx.session;

    if (step === "awaiting_coupon_code") {
      ctx.session.pendingCouponCode = ctx.message.text.trim().toUpperCase();
      ctx.session.step = "awaiting_coupon_type";

      const { InlineKeyboard } = await import("grammy");
      await ctx.reply(
        `Select discount type:`,
        {
          reply_markup: new InlineKeyboard()
            .text("Fixed Amount", "coupon_type_fixed")
            .text("Percentage", "coupon_type_percent"),
        }
      );
      return;
    }

    if (step === "awaiting_coupon_value") {
      const value = parseFloat(ctx.message.text.trim());
      if (isNaN(value) || value <= 0) {
        await ctx.reply("Please enter a valid positive number.");
        return;
      }

      ctx.session.pendingCouponValue = value;
      ctx.session.step = "awaiting_coupon_max_uses";

      await ctx.reply(
        `Set max uses (enter a number, or type <b>unlimited</b>):`,
        { parse_mode: "HTML" }
      );
      return;
    }

    if (step === "awaiting_coupon_max_uses") {
      const input = ctx.message.text.trim().toLowerCase();
      ctx.session.pendingCouponMaxUses =
        input === "unlimited" ? null : parseInt(input) || null;
      ctx.session.step = "awaiting_coupon_expiry";

      await ctx.reply(
        `Set expiry date (YYYY-MM-DD) or type <b>never</b>:`,
        { parse_mode: "HTML" }
      );
      return;
    }

    if (step === "awaiting_coupon_expiry") {
      const input = ctx.message.text.trim().toLowerCase();
      let expiresAt: Date | null = null;

      if (input !== "never") {
        const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
          expiresAt = new Date(
            parseInt(match[1]),
            parseInt(match[2]) - 1,
            parseInt(match[3])
          );
        }
      }

      ctx.session.step = undefined;
      await dbConnect();

      try {
        await Coupon.create({
          code: ctx.session.pendingCouponCode!,
          discountType: ctx.session.pendingCouponType as "fixed" | "percentage",
          discountValue: ctx.session.pendingCouponValue!,
          maxUses: ctx.session.pendingCouponMaxUses,
          expiresAt,
        });

        await ctx.reply(
          `${EMOJI.SUCCESS} Coupon <code>${ctx.session.pendingCouponCode}</code> created!`,
          {
            parse_mode: "HTML",
            reply_markup: backButton(CALLBACK.ADMIN_COUPONS),
          }
        );
      } catch (error) {
        await ctx.reply(
          `${EMOJI.CANCEL} Failed to create coupon. Code might already exist.`,
          { reply_markup: backButton(CALLBACK.ADMIN_COUPONS) }
        );
      }

      // Clean up session
      ctx.session.pendingCouponCode = undefined;
      ctx.session.pendingCouponType = undefined;
      ctx.session.pendingCouponValue = undefined;
      ctx.session.pendingCouponMaxUses = undefined;
      return;
    }

    return next();
  });

  // Coupon type selection callbacks
  bot.callbackQuery("coupon_type_fixed", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.pendingCouponType = "fixed";
    ctx.session.step = "awaiting_coupon_value";

    await ctx.editMessageText(
      `Enter the <b>fixed discount amount</b> in Naira (e.g. 5000):`,
      { parse_mode: "HTML" }
    );
  });

  bot.callbackQuery("coupon_type_percent", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.pendingCouponType = "percentage";
    ctx.session.step = "awaiting_coupon_value";

    await ctx.editMessageText(
      `Enter the <b>percentage discount</b> (e.g. 10 for 10%):`,
      { parse_mode: "HTML" }
    );
  });
}
