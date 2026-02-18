import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK, PAGE_SIZE } from "@/bot/constants";
import { subscriberListKeyboard, backButton } from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import { differenceInDays } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";

const TZ = "Africa/Lagos";

function formatSubscriberEntry(
  sub: InstanceType<typeof BotSubscriber>,
  index: number
): string {
  const statusIcon = sub.status === "active" ? EMOJI.ACTIVE : EMOJI.EXPIRED;
  const now = new Date();
  const daysLeft = Math.max(0, differenceInDays(sub.expiryDate, now));
  const zonedExpiry = toZonedTime(sub.expiryDate, TZ);
  const expiryStr = format(zonedExpiry, "yyyy-MM-dd HH:mm");

  let nameStr = "";
  if (sub.username) {
    nameStr += `@${sub.username} `;
  }
  if (sub.firstName || sub.lastName) {
    nameStr += `${sub.firstName || ""} ${sub.lastName || ""}`.trim();
  }
  if (!nameStr.trim()) {
    nameStr = "Unknown";
  }

  return (
    `${index}. ${statusIcon} ${nameStr} (${sub.userId})\n` +
    `   \u2514 Expires: ${expiryStr} (${daysLeft}d left)\n` +
    `   ${EMOJI.ARROW} /sub_${sub._id}`
  );
}

async function showSubscriberList(ctx: BotContext, page: number = 0) {
  await dbConnect();

  const total = await BotSubscriber.countDocuments({ status: "active" });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  page = Math.max(0, Math.min(page, totalPages - 1));

  const subscribers = await BotSubscriber.find({ status: "active" })
    .sort({ expiryDate: -1 })
    .skip(page * PAGE_SIZE)
    .limit(PAGE_SIZE);

  ctx.session.subscriberPage = page;

  if (subscribers.length === 0) {
    const text = `${EMOJI.SUBSCRIBERS} <b>Active Subscribers</b>\n\nNo active subscribers found.`;
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_PANEL),
      });
    } else {
      await ctx.reply(text, {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_PANEL),
      });
    }
    return;
  }

  const start = page * PAGE_SIZE + 1;
  const end = Math.min(start + subscribers.length - 1, total);

  const entries = subscribers.map((sub, i) =>
    formatSubscriberEntry(sub, start + i)
  );

  const text =
    `${EMOJI.SUBSCRIBERS} <b>Active Subscribers</b>\n\n` +
    entries.join("\n\n") +
    `\n\n<i>Showing ${start}-${end} of ${total}</i>`;

  const kb = subscriberListKeyboard(page, totalPages);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: kb });
  } else {
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
  }
}

export function registerSubscriberHandlers(bot: Bot<BotContext>) {
  // Show subscribers list
  bot.callbackQuery(CALLBACK.ADMIN_SUBSCRIBERS, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;
    await showSubscriberList(ctx, 0);
  });

  // Pagination: next
  bot.callbackQuery(CALLBACK.SUB_NEXT, async (ctx) => {
    await ctx.answerCallbackQuery();
    const page = (ctx.session.subscriberPage || 0) + 1;
    await showSubscriberList(ctx, page);
  });

  // Pagination: prev
  bot.callbackQuery(CALLBACK.SUB_PREV, async (ctx) => {
    await ctx.answerCallbackQuery();
    const page = Math.max(0, (ctx.session.subscriberPage || 0) - 1);
    await showSubscriberList(ctx, page);
  });

  // Back to admin panel
  bot.callbackQuery(CALLBACK.SUB_BACK, async (ctx) => {
    await ctx.answerCallbackQuery();
    // Will be handled by admin panel handler
    const { ADMIN_PANEL } = CALLBACK;
    const text = `${EMOJI.ADMIN_PANEL} <b>Admin Panel</b>\n\nChoose an action below.`;
    const { adminPanelKeyboard } = await import("@/bot/keyboards/inline");
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: adminPanelKeyboard(),
    });
  });

  // Search subscribers
  bot.callbackQuery(CALLBACK.SUB_SEARCH, async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_search_query";

    await ctx.editMessageText(
      `${EMOJI.SEARCH} <b>Search Subscribers</b>\n\n` +
        `Enter a Telegram ID, username, or name to search:\n\n` +
        `Send /cancel to go back`,
      { parse_mode: "HTML" }
    );
  });

  // Handle search query text
  bot.on("message:text", async (ctx, next) => {
    if (ctx.session.step !== "awaiting_search_query") {
      return next();
    }

    const query = ctx.message.text.trim();

    if (query === "/cancel") {
      ctx.session.step = undefined;
      await showSubscriberList(ctx, 0);
      return;
    }

    ctx.session.step = undefined;
    await dbConnect();

    // Search by userId, username, firstName, or lastName
    const results = await BotSubscriber.find({
      $or: [
        { userId: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
      ],
    })
      .sort({ expiryDate: -1 })
      .limit(PAGE_SIZE);

    if (results.length === 0) {
      // Re-show search prompt (as per spec — no error message)
      ctx.session.step = "awaiting_search_query";
      await ctx.reply(
        `${EMOJI.SEARCH} <b>Search Subscribers</b>\n\n` +
          `Enter a Telegram ID, username, or name to search:\n\n` +
          `Send /cancel to go back`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const entries = results.map((sub, i) =>
      formatSubscriberEntry(sub, i + 1)
    );

    await ctx.reply(
      `${EMOJI.SEARCH} <b>Search Results</b>\n\n` +
        entries.join("\n\n"),
      {
        parse_mode: "HTML",
        reply_markup: backButton(CALLBACK.ADMIN_SUBSCRIBERS),
      }
    );
  });
}
