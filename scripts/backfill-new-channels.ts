/**
 * Backfill: Create missing BotSubscriber records for the 3 active groups.
 *
 * After migrate-swap-channels.ts ran, old channel records were deleted but no
 * new records were created for the 3 new groups. This means users who subscribed
 * before the swap migration never get removed from the new groups when their
 * subscriptions expire (the cron job has nothing to act on).
 *
 * This script finds every unique userId that has an active subscription with ANY
 * channelId, then ensures a record exists for each of the 3 new groups with the
 * same expiry date as their latest active sub.
 *
 * Safe to run multiple times — skips records that already exist.
 *
 * Run with:
 *   npx ts-node --project tsconfig.scripts.json scripts/backfill-new-channels.ts
 */

import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import Plan from "../src/models/Plan";
import BotSubscriber from "../src/models/BotSubscriber";

const MONGODB_URI = process.env.MONGODB_URI!;

const LEGACY_CHANNEL_ID = "-1003699209692";

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB\n");

  const plan = await Plan.findOne({ isActive: true });
  if (!plan) {
    console.error("No active plan found. Aborting.");
    process.exit(1);
  }

  const channels = plan.channels?.length
    ? plan.channels
    : [{ channelId: plan.channelId, channelName: plan.channelName }];

  console.log(`Active plan: "${plan.name}"`);
  console.log(`Channels to backfill (${channels.length}):`);
  channels.forEach((c) => console.log(`  ${c.channelName} (${c.channelId})`));
  console.log();

  // Get all unique active subscriber userIds (excluding legacy channel)
  const activeSubs = await BotSubscriber.find({
    status: "active",
    channelId: { $ne: LEGACY_CHANNEL_ID },
  });

  const uniqueUserIds = [...new Set(activeSubs.map((s) => s.userId))];
  console.log(`Found ${uniqueUserIds.length} unique active subscribers\n`);

  let created = 0;
  let skipped = 0;

  for (const userId of uniqueUserIds) {
    // Get latest expiry across all their active subs
    const userSubs = activeSubs.filter((s) => s.userId === userId);
    const latestSub = userSubs.sort(
      (a, b) => b.expiryDate.getTime() - a.expiryDate.getTime()
    )[0];

    for (const channel of channels) {
      if (channel.channelId === LEGACY_CHANNEL_ID) continue;

      const exists = await BotSubscriber.findOne({
        userId,
        channelId: channel.channelId,
        status: "active",
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
        addedBy: "manual",
      });

      created++;
    }
  }

  console.log("Backfill complete:");
  console.log(`  Created: ${created} new BotSubscriber records`);
  console.log(`  Skipped: ${skipped} (already existed)`);
  console.log("\nThe cron job will now correctly remove expired users from all 3 groups.");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
