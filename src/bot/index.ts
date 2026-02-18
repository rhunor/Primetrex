import { Bot, session, webhookCallback } from "grammy";
import type { BotContext, SessionData } from "@/bot/context";
import { botConfig } from "@/bot/config";

// Create bot instance
const bot = new Bot<BotContext>(botConfig.token);

// Session middleware (in-memory)
bot.use(
  session({
    initial: (): SessionData => ({}),
  })
);

// Register handlers (order matters — specific handlers before generic ones)
import { registerStartHandlers } from "@/bot/handlers/start";
import { registerAdminHandlers } from "@/bot/handlers/admin";
import { registerSubscribeHandlers } from "@/bot/handlers/subscribe";
import { registerAddSubscriberHandlers } from "@/bot/handlers/addSubscriber";
import { registerSubscriberHandlers } from "@/bot/handlers/subscribers";
import { registerSpecialUserHandlers } from "@/bot/handlers/specialUsers";
import { registerCouponHandlers } from "@/bot/handlers/coupons";
import { registerAnalyticsHandlers } from "@/bot/handlers/analytics";
import { registerBroadcastHandlers } from "@/bot/handlers/broadcast";
import { registerPaymentHandlers } from "@/bot/handlers/payment";
import { registerAffiliateHandlers } from "@/bot/handlers/affiliate";

registerStartHandlers(bot);
registerAdminHandlers(bot);
registerSubscribeHandlers(bot);
registerAddSubscriberHandlers(bot);
registerSubscriberHandlers(bot);
registerSpecialUserHandlers(bot);
registerCouponHandlers(bot);
registerAnalyticsHandlers(bot);
registerBroadcastHandlers(bot);
registerPaymentHandlers(bot);
registerAffiliateHandlers(bot);

// Set up bot commands and menu button (runs once, idempotent)
let commandsSet = false;
async function setupBotCommands() {
  if (commandsSet) return;
  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Open the main menu" },
      { command: "help", description: "How to subscribe" },
      { command: "status", description: "Check your account status" },
    ]);
    await bot.api.setChatMenuButton({
      menu_button: { type: "commands" },
    });
    commandsSet = true;
  } catch (err) {
    console.error("Failed to set bot commands:", err);
  }
}
setupBotCommands();

// Error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});

// Export bot instance and webhook handler
export { bot };
export const handleUpdate = webhookCallback(bot, "std/http");
