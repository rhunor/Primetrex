import { Bot, session, webhookCallback } from "grammy";
import type { BotContext, SessionData } from "@/bot/context";
import { botConfig } from "@/bot/config";

const bot = new Bot<BotContext>(botConfig.token);

bot.use(
  session({
    initial: (): SessionData => ({}),
  })
);

// ── Active handlers: Averis Academy ──────────────────────────────────────────
import { registerStartHandlers } from "@/bot/handlers/start";
import { registerAverisHandlers } from "@/bot/handlers/averis/index";

registerStartHandlers(bot);
registerAverisHandlers(bot);

// ── Primetrex handlers are preserved in their files for easy re-activation ───
// To re-enable, uncomment the imports + registrations below:
//
// import { registerAdminHandlers }       from "@/bot/handlers/admin";
// import { registerSubscribeHandlers }   from "@/bot/handlers/subscribe";
// import { registerAddSubscriberHandlers } from "@/bot/handlers/addSubscriber";
// import { registerSubscriberHandlers }  from "@/bot/handlers/subscribers";
// import { registerSpecialUserHandlers } from "@/bot/handlers/specialUsers";
// import { registerCouponHandlers }      from "@/bot/handlers/coupons";
// import { registerAnalyticsHandlers }   from "@/bot/handlers/analytics";
// import { registerBroadcastHandlers }   from "@/bot/handlers/broadcast";
// import { registerRetentionHandlers }   from "@/bot/handlers/retention";
// import { registerPaymentHandlers }     from "@/bot/handlers/payment";
// import { registerAffiliateHandlers }   from "@/bot/handlers/affiliate";

// Set bot commands
let commandsSet = false;
async function setupBotCommands() {
  if (commandsSet) return;
  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Welcome to Averis Academy" },
      { command: "help", description: "How the bot works" },
      { command: "status", description: "Check your subscription" },
    ]);
    await bot.api.setChatMenuButton({ menu_button: { type: "commands" } });
    commandsSet = true;
  } catch (err) {
    console.error("Failed to set bot commands:", err);
  }
}
if (botConfig.token && process.env.NEXT_PHASE !== "phase-production-build") setupBotCommands();

bot.catch((err) => {
  console.error("Bot error:", err);
});

export { bot };
export const handleUpdate = webhookCallback(bot, "std/http");
