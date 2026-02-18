export const botConfig = {
  token: process.env.TELEGRAM_BOT_TOKEN!,
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET!,
  timezone: "Africa/Lagos",

  // Flutterwave
  flwSecretKey: process.env.FLW_SECRET_KEY || "",
  flwPublicKey: process.env.FLW_PUBLIC_KEY || "",
  flwWebhookSecret: process.env.FLW_WEBHOOK_SECRET || "",
  flwRedirectUrl: process.env.FLW_REDIRECT_URL || "",

  // Admin IDs from env (comma-separated)
  adminIds: (process.env.BOT_ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),

  // Bot username (without @)
  botUsername: process.env.TELEGRAM_BOT_USERNAME || "PrimetrexBot",

  // App URL
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Cron secret
  cronSecret: process.env.CRON_SECRET || "",
} as const;
