/**
 * Migration: Add all 3 new channels to the Plan, then create BotSubscriber
 * records for active subscribers in each new channel, and send invite links.
 *
 * Safe to run multiple times — skips records that already exist.
 *
 * Run with:
 *   npm run migrate:multi-channel
 */

import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import Plan from "../src/models/Plan";
import BotSubscriber from "../src/models/BotSubscriber";

const MONGODB_URI = process.env.MONGODB_URI!;

const NEW_CHANNELS = [
  { channelId: "-1003822078592", channelName: "Primetrex synthetic day & swing copy trades" },
  { channelId: "-1003686018480", channelName: "Primetrex currency swing copy trades" },
  { channelId: "-1003527548332", channelName: "Primetrex Currency day copy trades" },
];

const RATE_LIMIT_DELAY_MS = 400;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // ── Step 1: Update Plan to include all 3 new channels ─────────────────────
  const plan = await Plan.findOne({ isActive: true });
  if (!plan) {
    console.error("No active plan found. Aborting.");
    process.exit(1);
  }

  const existingChannelIds = new Set((plan.channels || []).map((c) => c.channelId));
  let channelsAdded = 0;

  for (const ch of NEW_CHANNELS) {
    if (!existingChannelIds.has(ch.channelId)) {
      plan.channels.push(ch);
      channelsAdded++;
    }
  }

  if (channelsAdded > 0) {
    await plan.save();
    console.log(`Added ${channelsAdded} channel(s) to plan "${plan.name}"`);
  } else {
    console.log("Plan channels already up to date.");
  }

  // ── Step 2: Get all active subscribers from any existing channel ───────────
  const activeSubscribers = await BotSubscriber.find({ status: "active" });
  const uniqueUserIds = [...new Set(activeSubscribers.map((s) => s.userId))];

  console.log(`Found ${uniqueUserIds.length} unique active subscribers to migrate`);

  let created = 0;
  let skipped = 0;

  // ── Step 3: For each user, get their latest expiry and create records ───────
  for (const userId of uniqueUserIds) {
    // Get the latest expiry across all their active subs
    const userSubs = activeSubscribers.filter((s) => s.userId === userId);
    const latestSub = userSubs.sort(
      (a, b) => b.expiryDate.getTime() - a.expiryDate.getTime()
    )[0];

    for (const channel of NEW_CHANNELS) {
      const exists = await BotSubscriber.findOne({
        userId,
        channelId: channel.channelId,
      });

      if (exists) {
        skipped++;
        continue;
      }

      await BotSubscriber.create({
        userId,
        username: latestSub.username || null,
        firstName: latestSub.firstName || null,
        lastName: latestSub.lastName || null,
        planId: latestSub.planId,
        channelId: channel.channelId,
        startDate: latestSub.startDate,
        expiryDate: latestSub.expiryDate,
        status: "active",
        addedBy: "migration",
      });

      created++;
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Created: ${created} new BotSubscriber records`);
  console.log(`  Skipped: ${skipped} (already existed)`);
  console.log(`\nNext step: Deploy to Vercel, then run /addallusers in the bot`);
  console.log(`to send invite links to all active subscribers for the new channels.`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
