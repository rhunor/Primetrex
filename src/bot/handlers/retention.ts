import type { Bot } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { backButton } from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import BotSubscriber from "@/models/BotSubscriber";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function streakDays(sub: { startDate: Date; expiryDate: Date; status: string }): number {
  if (sub.status === "active") {
    return Math.floor((Date.now() - new Date(sub.startDate).getTime()) / MS_PER_DAY);
  }
  return Math.floor(
    (new Date(sub.expiryDate).getTime() - new Date(sub.startDate).getTime()) / MS_PER_DAY
  );
}

function fmt(date: Date): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

export function registerRetentionHandlers(bot: Bot<BotContext>) {
  bot.callbackQuery(CALLBACK.ADMIN_RETENTION, async (ctx) => {
    await ctx.answerCallbackQuery();
    const admin = await isAdmin(ctx);
    if (!admin) return;

    await ctx.editMessageText(
      `${EMOJI.REPORT} <b>Generating retention report…</b>`,
      { parse_mode: "HTML" }
    );

    await dbConnect();

    // Fetch all subscribers (one record per user — earliest startDate)
    const allSubs = await BotSubscriber.find().sort({ startDate: 1 }).lean();

    // De-duplicate: one entry per userId, keeping earliest startDate record
    const byUser = new Map<string, (typeof allSubs)[0]>();
    for (const sub of allSubs) {
      if (!byUser.has(sub.userId)) {
        byUser.set(sub.userId, sub);
      }
    }
    const uniqueSubs = Array.from(byUser.values());

    const total = uniqueSubs.length;
    const active = uniqueSubs.filter((s) => s.status === "active").length;
    const expired = uniqueSubs.filter((s) => s.status !== "active").length;

    const streaks = uniqueSubs.map((s) => streakDays(s));
    const avgStreak =
      total > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / total) : 0;

    // Top 5 longest streaks
    const sorted = [...uniqueSubs]
      .map((s) => ({ sub: s, days: streakDays(s) }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

    const topLines = sorted
      .map(({ sub, days }) => {
        const name =
          [sub.firstName, sub.lastName].filter(Boolean).join(" ") ||
          sub.username ||
          sub.userId;
        const tag = sub.status === "active" ? EMOJI.ACTIVE : EMOJI.EXPIRED;
        return `  ${tag} ${name} — <b>${days}d</b>`;
      })
      .join("\n");

    // 5 most recently expired (to see who just left)
    const recentlyLeft = uniqueSubs
      .filter((s) => s.status !== "active")
      .sort(
        (a, b) =>
          new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
      )
      .slice(0, 5);

    const leftLines = recentlyLeft
      .map((s) => {
        const name =
          [s.firstName, s.lastName].filter(Boolean).join(" ") ||
          s.username ||
          s.userId;
        const days = streakDays(s);
        return `  • ${name} — stayed <b>${days}d</b>, left ${fmt(s.expiryDate)}`;
      })
      .join("\n");

    let report =
      `${EMOJI.REPORT} <b>Subscriber Retention Report</b>\n\n` +
      `${EMOJI.PERSON} Total ever: <b>${total}</b>\n` +
      `${EMOJI.ACTIVE} Currently active: <b>${active}</b>\n` +
      `${EMOJI.EXPIRED} Churned: <b>${expired}</b>\n` +
      `${EMOJI.STREAK} Avg streak: <b>${avgStreak} days</b>\n`;

    if (topLines) {
      report += `\n<b>Longest Streaks:</b>\n${topLines}\n`;
    }

    if (leftLines) {
      report += `\n<b>Recently Left:</b>\n${leftLines}\n`;
    }

    await ctx.editMessageText(report, {
      parse_mode: "HTML",
      reply_markup: backButton(CALLBACK.ADMIN_PANEL),
    });
  });
}
