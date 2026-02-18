import { Keyboard } from "grammy";
import type { BotContext } from "@/bot/context";
import { EMOJI, CALLBACK } from "@/bot/constants";
import { mainMenuKeyboard, helpKeyboard } from "@/bot/keyboards/inline";
import { isAdmin } from "@/bot/middleware/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Plan from "@/models/Plan";

const replyKeyboard = new Keyboard()
  .text("\u2261 Main Menu")
  .text(`${EMOJI.SUBSCRIBE} Subscribe`)
  .resized()
  .persistent();

async function showMainMenu(ctx: BotContext) {
  const firstName = ctx.from?.first_name || "there";
  const admin = await isAdmin(ctx);

  const text =
    `${EMOJI.WAVE} Hi <b>${firstName}</b>!\n\n` +
    `Welcome to the official  <b>Primetrex Community Subscription</b> bot.\n\n` +
    `${EMOJI.ROCKET} <b>Get Premium Access</b>\n\n` +
    `Subscribe now to unlock exclusive copy trading from Primetrex\n\n` +
    `${EMOJI.POINT_DOWN} Tap <b>Subscribe</b> below to view available plans.`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(admin),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(admin),
    });
    await ctx.reply(`${EMOJI.POINT_DOWN} Use the menu below for quick access:`, {
      reply_markup: replyKeyboard,
    });
  }
}

async function showHelp(ctx: BotContext) {
  await dbConnect();
  const plan = await Plan.findOne({ isActive: true });

  const price = plan ? `\u20A6${plan.price.toLocaleString("en-NG")}` : "\u20A650,000";
  const renewalPrice = plan
    ? `\u20A6${plan.renewalPrice.toLocaleString("en-NG")}`
    : "\u20A635,000";
  const planName = plan?.name || "Primetrex";

  const text =
    `${EMOJI.HELP} <b>Help</b>\n\n` +
    `\u2022 Tap subscribe for ${planName} first payment of ${price} if you want to make first payment\n` +
    `\u2022 Tap renew to make a renewal payment of ${renewalPrice} if you want to renew your subscription\n` +
    `\u2022 If you paid already, tap <b>I've Paid</b> to verify.\n\n` +
    `If you have issues, contact the channel admin.`;

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

async function handleStartLink(ctx: BotContext, referralCode: string) {
  await dbConnect();
  const telegramUserId = ctx.from!.id.toString();

  const user = await User.findOne({ referralCode });
  if (!user) {
    await ctx.reply("Invalid link. Please check your referral code and try again.");
    return;
  }

  if (user.telegramLinked && user.telegramId !== telegramUserId) {
    await ctx.reply(
      "This account is already linked to a different Telegram user."
    );
    return;
  }

  user.telegramId = telegramUserId;
  user.telegramLinked = true;
  await user.save();

  await ctx.reply(
    `<b>Account Linked Successfully!</b>\n\n` +
      `Name: ${user.firstName} ${user.lastName}\n` +
      `Email: ${user.email}\n\n` +
      `Use /subscribe to pay your monthly copy trading subscription.\n` +
      `Use /status to check your account status.`,
    { parse_mode: "HTML" }
  );
}

export function registerStartHandlers(bot: import("grammy").Bot<BotContext>) {
  // /start command
  bot.command("start", async (ctx) => {
    const payload = ctx.match;

    if (typeof payload === "string" && payload.startsWith("link_")) {
      await handleStartLink(ctx, payload.replace("link_", ""));
      return;
    }

    // Handle payment success deep link
    if (typeof payload === "string" && payload.startsWith("payment_success_")) {
      await ctx.reply(
        `${EMOJI.SUCCESS} Payment received! Your subscription is being activated.\n\n` +
          `You'll receive your invite link shortly.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    if (typeof payload === "string" && payload === "payment_failed") {
      await ctx.reply(
        `${EMOJI.CANCEL} Payment was not completed. Please try again.`,
        { parse_mode: "HTML" }
      );
      return;
    }

    await showMainMenu(ctx);
  });

  // /help command
  bot.command("help", showHelp);

  // /status command
  bot.command("status", async (ctx) => {
    await dbConnect();
    const user = await User.findOne({
      telegramId: ctx.from!.id.toString(),
    });

    if (!user) {
      await ctx.reply(
        "Your Telegram is not linked to any Primetrex account.\n\n" +
          "Visit your dashboard to link your account."
      );
      return;
    }

    const statusText = user.isActive ? "Active" : "Inactive";
    await ctx.reply(
      `<b>Account Status</b>\n\n` +
        `Name: ${user.firstName} ${user.lastName}\n` +
        `Email: ${user.email}\n` +
        `Status: ${statusText}\n` +
        `Referral Code: <code>${user.referralCode}</code>`,
      { parse_mode: "HTML" }
    );
  });

  // "Main Menu" text from reply keyboard
  bot.hears("\u2261 Main Menu", showMainMenu);
  bot.hears(`${EMOJI.SUBSCRIBE} Subscribe`, async (ctx) => {
    // Trigger subscribe callback
    await ctx.reply("Loading subscription...");
    // Will be handled by subscribe handler's callback
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

  // Callback: admin_exit (back to main menu from admin)
  bot.callbackQuery(CALLBACK.ADMIN_EXIT, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showMainMenu(ctx);
  });
}
