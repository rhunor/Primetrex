import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { mainMenuKeyboard, helpKeyboard } from "@/bot/keyboards/inline";
import { handleAverisJoin, getAverisStatus } from "@/bot/services/averis/groupManager";

const AVERIS_APP_URL = process.env.AVERIS_APP_URL || "https://app.averisacademy.com";

const WELCOME_TEXT =
  `${EMOJI.WAVE} <b>Welcome to Averis Academy!</b>\n\n` +
  `Averis Academy is Africa's #1 wealth creation platform — we help you build real income selling digital products online, then invest that income to build generational wealth.\n\n` +
  `<b>Here's what I can help you with:</b>\n` +
  `✅ Check your Averis Academy subscription status\n` +
  `🔄 Renew your subscription when it's expiring\n` +
  `🔗 Get your invite link to the Averis community\n` +
  `🔔 Receive automatic reminders before your subscription expires\n\n` +
  `<b>To get started:</b>\n` +
  `Purchase your Averis Academy subscription on our website and tap the <b>Join Community via Bot</b> button in your welcome email — it links your account here automatically.\n\n` +
  `${EMOJI.POINT_DOWN} Use the menu below to manage your account.`;

async function showMainMenu(ctx: BotContext) {
  const telegramId = ctx.from!.id.toString();
  const status = await getAverisStatus(telegramId);
  const hasSubscription = !!(status?.isSubscribed);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(WELCOME_TEXT, {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(hasSubscription),
    });
  } else {
    await ctx.reply(WELCOME_TEXT, {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(hasSubscription),
    });
  }
}

async function showHelp(ctx: BotContext) {
  const text =
    `${EMOJI.HELP} <b>How Averis Academy Bot Works</b>\n\n` +
    `<b>1. Subscribe on the website</b>\n` +
    `Go to <a href="${AVERIS_APP_URL}">${AVERIS_APP_URL}</a> to purchase your subscription.\n\n` +
    `<b>2. Connect your account</b>\n` +
    `Tap the <b>Join Community via Bot</b> button in your welcome email to link your Averis account to this bot.\n\n` +
    `<b>3. Join the community</b>\n` +
    `The bot verifies your payment and sends you a single-use invite link to the Averis Academy community group.\n\n` +
    `<b>4. Renewal reminders</b>\n` +
    `You'll get automatic reminders 30, 15, 7 and 3 days before your subscription expires so you never lose access.\n\n` +
    `<b>Renewal price:</b> ₦30,000 for another 6 months\n\n` +
    `Need help? Contact support: <a href="https://wa.me/2348085300040">WhatsApp</a>`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: helpKeyboard(),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: helpKeyboard(),
    });
  }
}

export function registerStartHandlers(bot: import("grammy").Bot<BotContext>) {
  bot.command("start", async (ctx) => {
    const payload = ctx.match;

    // Averis deep link: averis_link_{referralCode}
    if (typeof payload === "string" && payload.startsWith("averis_link_")) {
      const referralCode = payload.replace("averis_link_", "");
      const telegramId = ctx.from!.id.toString();
      const firstName = ctx.from?.first_name || "there";

      await ctx.reply(
        `${EMOJI.HOURGLASS} <b>Connecting your Averis Academy account...</b>`,
        { parse_mode: "HTML" }
      );

      const result = await handleAverisJoin(telegramId, firstName, referralCode);

      if (!result.success) {
        await ctx.reply(
          `${EMOJI.WARNING} <b>Could not connect account</b>\n\n${result.message}\n\nNeed help? Contact <a href="https://wa.me/2348085300040">support</a>.`,
          { parse_mode: "HTML" }
        );
      }
      // On success, handleAverisJoin already sent the invite DM
      return;
    }

    await showMainMenu(ctx);
  });

  bot.command("help", showHelp);

  bot.command("status", async (ctx) => {
    const telegramId = ctx.from!.id.toString();
    const status = await getAverisStatus(telegramId);

    if (!status?.isSubscribed) {
      await ctx.reply(
        `\u{1F534} <b>No Active Subscription</b>\n\n` +
          `Your Telegram account is not linked to an active Averis Academy subscription.\n\n` +
          `Subscribe at <a href="${AVERIS_APP_URL}">${AVERIS_APP_URL}</a> then use the link in your welcome email to connect here.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const expiryStr = status.expiryDate!.toLocaleDateString("en-NG", {
      day: "numeric", month: "long", year: "numeric",
    });
    const daysLeft = status.daysLeft!;
    const urgency = daysLeft <= 3 ? "\u{1F534}" : daysLeft <= 15 ? "⚠️" : "\u{1F7E2}";

    await ctx.reply(
      `${urgency} <b>Subscription Active</b>\n\n` +
        `Hi <b>${status.firstName}</b>!\n\n` +
        `Expires: <b>${expiryStr}</b>\n` +
        `Days left: <b>${daysLeft} day${daysLeft === 1 ? "" : "s"}</b>\n\n` +
        (daysLeft <= 30
          ? `<a href="${AVERIS_APP_URL}/dashboard/subscription">Renew for ₦30,000 →</a>`
          : `Keep sharing your affiliate link to earn commissions!`),
      { parse_mode: "HTML" }
    );
  });

  // Callback: main_menu
  bot.callbackQuery(CALLBACK.MAIN_MENU, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showMainMenu(ctx);
  });

  // Callback: help
  bot.callbackQuery(CALLBACK.HELP, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showHelp(ctx);
  });
}
