export const botConfig = {
  token: process.env.TELEGRAM_BOT_TOKEN!,
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET!,
  timezone: "Africa/Lagos",

  // Korapay
  koraSecretKey: process.env.KORA_SECRET_KEY || "",
  koraPublicKey: process.env.KORA_PUBLIC_KEY || "",
  koraRedirectUrl: process.env.KORA_REDIRECT_URL || "",

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
