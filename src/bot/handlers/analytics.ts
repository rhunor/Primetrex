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
      totalSubs,
      activeSubs,
      expiredSubs,
      monthlyPayments,
      allTimePayments,
      weeklyNew,
      monthlyRenewals,
    ] = await Promise.all([
      BotSubscriber.countDocuments(),
      BotSubscriber.countDocuments({ status: "active" }),
      BotSubscriber.countDocuments({ status: "expired" }),
      BotPayment.aggregate([
        {
          $match: {
            status: "successful",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      BotPayment.aggregate([
        { $match: { status: "successful" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      BotSubscriber.countDocuments({
        createdAt: { $gte: startOfWeek },
      }),
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
      `${EMOJI.CHART} Total Subscribers: ${totalSubs}\n` +
      `${EMOJI.ACTIVE} Active: ${activeSubs}\n` +
      `${EMOJI.EXPIRED} Expired: ${expiredSubs}\n` +
      `${EMOJI.MONEY} Revenue This Month: ${formatNaira(monthlyRevenue)}\n` +
      `${EMOJI.MONEY} Revenue All Time: ${formatNaira(totalRevenue)}\n` +
      `${EMOJI.CALENDAR} New This Week: ${weeklyNew}\n` +
      `${EMOJI.RENEW} Renewals This Month: ${monthlyRenewals}`;

    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: backButton(CALLBACK.ADMIN_PANEL),
    });
  });
}
