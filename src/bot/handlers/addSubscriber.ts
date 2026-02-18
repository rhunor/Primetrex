import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { backButton } from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import Plan from "@/models/Plan";
import { manualActivateSubscriber } from "@/bot/services/subscription";
import { InlineKeyboard } from "grammy";
import { toZonedTime } from "date-fns-tz";

const TZ = "Africa/Lagos";

function parseDate(input: string): Date | null {
  // Accept YYYY-MM-DD or YYYY-MM-DD HH:MM
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?$/;
  const match = input.match(dateRegex);
  if (!match) return null;

  const [, year, month, day, hours, minutes] = match;
  const date = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    hours ? parseInt(hours) : 0,
    minutes ? parseInt(minutes) : 0
  );

  if (isNaN(date.getTime())) return null;
  return date;
}

export function registerAddSubscriberHandlers(bot: Bot<BotContext>) {
  // Step 1: Prompt for user ID
  bot.callbackQuery(CALLBACK.ADMIN_ADD_SUB, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;

    ctx.session.step = "awaiting_user_id";

    await ctx.editMessageText(
      `${EMOJI.PERSON} <b>Enter User ID</b>\n\n` +
        `Please send the Telegram User ID (numeric).\n` +
        `Or forward a message from them.`,
      {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_PANEL),
      }
    );
  });

  // Handle text inputs for the multi-step add subscriber flow
  bot.on("message:text", async (ctx, next) => {
    const { step } = ctx.session;

    if (
      step !== "awaiting_user_id" &&
      step !== "awaiting_start_date" &&
      step !== "awaiting_expiry_date"
    ) {
      return next();
    }

    await dbConnect();

    // Step 1: User ID
    if (step === "awaiting_user_id") {
      const text = ctx.message.text.trim();
      const userId = parseInt(text);

      if (isNaN(userId)) {
        await ctx.reply("Please enter a valid numeric Telegram User ID.");
        return;
      }

      ctx.session.pendingUserId = userId;
      ctx.session.step = "awaiting_plan_selection";

      // Show plan selection
      const plans = await Plan.find({ isActive: true });
      const kb = new InlineKeyboard();

      for (const plan of plans) {
        kb.text(
          `${plan.name} (${plan.durationDays} days)`,
          `${CALLBACK.PLAN_PREFIX}${plan._id}`
        ).row();
      }
      kb.text(`${EMOJI.BACK} Back`, CALLBACK.ADMIN_ADD_SUB);

      await ctx.reply(
        `${EMOJI.FOLDER} <b>Select Plan</b>\n\nAssign a plan for this user:`,
        { parse_mode: "HTML", reply_markup: kb }
      );
      return;
    }

    // Step 3: Start date
    if (step === "awaiting_start_date") {
      const input = ctx.message.text.trim().toLowerCase();
      let startDate: Date;

      if (input === "now") {
        startDate = new Date();
      } else {
        const parsed = parseDate(input);
        if (!parsed) {
          await ctx.reply(
            "Invalid date format. Please use YYYY-MM-DD HH:MM or type <b>now</b>.",
            { parse_mode: "HTML" }
          );
          return;
        }
        startDate = parsed;
      }

      ctx.session.pendingStartDate = startDate.toISOString();
      ctx.session.step = "awaiting_expiry_date";

      await ctx.reply(
        `${EMOJI.HOURGLASS} Enter the <b>expiry date/time</b> for this user.\n\n` +
          `<b>Format:</b> YYYY\u2011MM\u2011DD or YYYY\u2011MM\u2011DD HH:MM\n` +
          `<b>Timezone:</b> ${TZ}\n\n` +
          `<b>Examples:</b>\n` +
          `\u2022 2026\u201102\u201108\n` +
          `\u2022 2026\u201102\u201108 14:30\n\n` +
          `${EMOJI.TIP} <b>Tip:</b> Type <code>skip</code> to use the Plan's default duration (calculated from Start Date).`,
        { parse_mode: "HTML" }
      );
      return;
    }

    // Step 4: Expiry date
    if (step === "awaiting_expiry_date") {
      const input = ctx.message.text.trim().toLowerCase();
      let expiryDate: Date;

      if (input === "skip") {
        // Calculate from start date + plan duration
        const plan = await Plan.findById(ctx.session.pendingPlanId);
        if (!plan) {
          await ctx.reply("Plan not found. Please start over.");
          ctx.session.step = undefined;
          return;
        }
        const startDate = new Date(ctx.session.pendingStartDate!);
        expiryDate = new Date(
          startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
        );
      } else {
        const parsed = parseDate(input);
        if (!parsed) {
          await ctx.reply(
            "Invalid date format. Please use YYYY-MM-DD or YYYY-MM-DD HH:MM.",
            { parse_mode: "HTML" }
          );
          return;
        }
        expiryDate = parsed;
      }

      // Reset session step
      ctx.session.step = undefined;

      const userId = ctx.session.pendingUserId!;
      const planId = ctx.session.pendingPlanId!;
      const startDate = new Date(ctx.session.pendingStartDate!);

      // Try to get user info from Telegram
      let username: string | null = null;
      let firstName: string | null = null;
      let lastName: string | null = null;
      try {
        const chatMember = await ctx.api.getChat(userId);
        if ("username" in chatMember) username = chatMember.username || null;
        if ("first_name" in chatMember) firstName = chatMember.first_name || null;
        if ("last_name" in chatMember) lastName = (chatMember as { last_name?: string }).last_name || null;
      } catch {
        // Can't fetch user info
      }

      const result = await manualActivateSubscriber({
        userId: userId.toString(),
        username,
        firstName,
        lastName,
        planId,
        startDate,
        expiryDate,
      });

      if (!result.success && result.message === "duplicate") {
        await ctx.reply(
          `${EMOJI.BLOCKED} <b>Action Blocked</b>\n\n` +
            `User ${userId} already exists in the whitelist.\n\n` +
            `<b>Duplicates are not allowed.</b>\nPlease click Back to return.`,
          {
            parse_mode: "HTML",
            reply_markup: backButton(CALLBACK.ADMIN_PANEL),
          }
        );
        return;
      }

      if (!result.success) {
        await ctx.reply(`${EMOJI.CANCEL} ${result.message}`, {
          reply_markup: backButton(CALLBACK.ADMIN_PANEL),
        });
        return;
      }

      const plan = await Plan.findById(planId);
      const zonedExpiry = toZonedTime(expiryDate, TZ);
      const expiryStr = `${zonedExpiry.getFullYear()}-${String(zonedExpiry.getMonth() + 1).padStart(2, "0")}-${String(zonedExpiry.getDate()).padStart(2, "0")} ${String(zonedExpiry.getHours()).padStart(2, "0")}:${String(zonedExpiry.getMinutes()).padStart(2, "0")}`;

      let successText =
        `${EMOJI.SUCCESS} <b>User Added Successfully!</b>\n` +
        `User ID: ${userId}\n` +
        `Channel: <b>${plan?.channelName || "Unknown"}</b>\n` +
        `Expires: ${expiryStr}\n\n`;

      if (result.message === "invite_sent") {
        successText += `${EMOJI.INVITE} Invite sent to user via DM.`;
      } else if (result.inviteLink) {
        successText += `${EMOJI.WARNING} Could not DM user.\n${result.inviteLink}`;
      }

      await ctx.reply(successText, {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_PANEL),
      });

      // Clear session
      ctx.session.pendingUserId = undefined;
      ctx.session.pendingPlanId = undefined;
      ctx.session.pendingStartDate = undefined;
      return;
    }

    return next();
  });

  // Handle forwarded messages (to extract user ID)
  bot.on("message:forward_origin", async (ctx, next) => {
    if (ctx.session.step !== "awaiting_user_id") {
      return next();
    }

    const forwardOrigin = ctx.message.forward_origin;
    if (forwardOrigin && forwardOrigin.type === "user") {
      const userId = forwardOrigin.sender_user.id;
      ctx.session.pendingUserId = userId;
      ctx.session.step = "awaiting_plan_selection";

      await dbConnect();
      const plans = await Plan.find({ isActive: true });
      const kb = new InlineKeyboard();

      for (const plan of plans) {
        kb.text(
          `${plan.name} (${plan.durationDays} days)`,
          `${CALLBACK.PLAN_PREFIX}${plan._id}`
        ).row();
      }
      kb.text(`${EMOJI.BACK} Back`, CALLBACK.ADMIN_ADD_SUB);

      await ctx.reply(
        `${EMOJI.FOLDER} <b>Select Plan</b>\n\nAssign a plan for this user:`,
        { parse_mode: "HTML", reply_markup: kb }
      );
      return;
    }

    return next();
  });

  // Plan selection callback (dynamic)
  bot.callbackQuery(/^plan_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const planId = ctx.callbackQuery.data.replace(CALLBACK.PLAN_PREFIX, "");
    ctx.session.pendingPlanId = planId;
    ctx.session.step = "awaiting_start_date";

    await ctx.editMessageText(
      `${EMOJI.CALENDAR} <b>Subscription Start Date</b>\n\n` +
        `Enter start date (YYYY-MM-DD HH:MM)\n` +
        `Or type <b>now</b> for immediate start.`,
      { parse_mode: "HTML" }
    );
  });
}
