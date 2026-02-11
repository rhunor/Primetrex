const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: "private" | "group" | "supergroup" | "channel";
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  date: number;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

interface ReplyMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: ReplyMarkup
) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }),
  });
  return res.json();
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

export async function setWebhook(url: string, secretToken: string) {
  const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      allowed_updates: ["message", "callback_query"],
      secret_token: secretToken,
      drop_pending_updates: true,
    }),
  });
  return res.json();
}

export async function getWebhookInfo() {
  const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
  return res.json();
}

export function parseCommand(text: string): { command: string; payload: string } | null {
  const match = text.match(/^\/([a-z_]+)(?:\s+(.*))?$/i);
  if (!match) return null;
  return { command: match[1].toLowerCase(), payload: match[2] || "" };
}
