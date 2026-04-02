import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { backButton } from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";
import BotPayment from "@/models/BotPayment";

function formatNaira(amount: number): string {
  return `\u20A6${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function registerAnalyticsHandlers(bot: Bot<BotContext>) {
  bot.callbackQuery(CALLBACK.ADMIN_ANALYTICS, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;

    await dbConnect();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      allUserIds,
      activeUserIds,
      expiredUserIds,
      weeklyNewUserIds,
      monthlyPayments,
      allTimePayments,
      monthlyRenewals,
    ] = await Promise.all([
      BotSubscriber.distinct("userId"),
      BotSubscriber.distinct("userId", { status: "active" }),
      BotSubscriber.distinct("userId", { status: "expired" }),
      BotSubscriber.distinct("userId", { createdAt: { $gte: startOfWeek } }),
      BotPayment.aggregate([
        { $match: { status: "successful", createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      BotPayment.aggregate([
        { $match: { status: "successful" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      BotPayment.countDocuments({
        status: "successful",
        paymentType: "renewal",
        createdAt: { $gte: startOfMonth },
      }),
    ]);

    const monthlyRevenue = monthlyPayments[0]?.total || 0;
    const totalRevenue = allTimePayments[0]?.total || 0;

    const text =
      `${EMOJI.ANALYTICS} <b>Analytics Dashboard</b>\n\n` +
      `${EMOJI.CHART} <b>Unique Users (all time):</b> ${allUserIds.length}\n` +
      `${EMOJI.ACTIVE} Active subscribers: ${activeUserIds.length}\n` +
      `${EMOJI.EXPIRED} Expired subscribers: ${expiredUserIds.length}\n` +
      `${EMOJI.CALENDAR} New this week: ${weeklyNewUserIds.length}\n` +
      `${EMOJI.MONEY} Revenue this month: ${formatNaira(monthlyRevenue)}\n` +
      `${EMOJI.MONEY} Revenue all time: ${formatNaira(totalRevenue)}\n` +
      `${EMOJI.RENEW} Renewals this month: ${monthlyRenewals}`;

    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: backButton(CALLBACK.ADMIN_PANEL),
    });
  });
}
