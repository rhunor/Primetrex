import dbConnect from "@/lib/db";
import BotAdmin from "@/models/BotAdmin";
import { botConfig } from "@/bot/config";
import type { BotContext } from "@/bot/context";

export async function isAdmin(ctx: BotContext): Promise<boolean> {
  const userId = ctx.from?.id;
  if (!userId) return false;

  const userIdStr = userId.toString();

  // Check hardcoded admin IDs first (from env)
  if (botConfig.adminIds.includes(userIdStr)) return true;

  // Check database
  await dbConnect();
  const admin = await BotAdmin.findOne({ userId: userIdStr });
  return !!admin;
}
