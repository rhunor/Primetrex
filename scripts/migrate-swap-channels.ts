/**
 * Migration: Swap old 3 channels for 3 new groups on the Plan,
 * delete BotSubscriber records for old channels,
 * and extend all active subscribers by 14 days.
 *
 * Safe to run once. Run with:
 *   npm run migrate:swap-channels
 */

import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import Plan from "../src/models/Plan";
import BotSubscriber from "../src/models/BotSubscriber";

const MONGODB_URI = process.env.MONGODB_URI!;

const OLD_CHANNEL_IDS = [
  "-1003822078592",
  "-1003686018480",
  "-1003527548332",
];

const NEW_GROUPS = [
  { channelId: "-1003737192565", channelName: "Primetrex Currency day copy trades" },
  { channelId: "-1003862111641", channelName: "Primetrex currency swing copy trades" },
  { channelId: "-1003752371103", channelName: "Primetrex synthetic day & swing copy trades" },
];

// Original legacy channel — bot no longer manages this
const LEGACY_CHANNEL_ID = "-1003699209692";

const EXTEND_DAYS = 14;

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB\n");

  // ── Step 1: Update Plan channels ─────────────────────────────────────────
  const plan = await Plan.findOne({ isActive: true });
  if (!plan) {
    console.error("No active plan found. Aborting.");
    process.exit(1);
  }

  // Remove old channels and legacy channel from plan, add new groups
  const filteredChannels = (plan.channels || []).filter(
    (c: { channelId: string }) =>
      !OLD_CHANNEL_IDS.includes(c.channelId) && c.channelId !== LEGACY_CHANNEL_ID
  );

  // Add new groups (skip if already present)
  const existingIds = new Set(filteredChannels.map((c: { channelId: string }) => c.channelId));
  for (const group of NEW_GROUPS) {
    if (!existingIds.has(group.channelId)) {
      filteredChannels.push(group);
    }
  }

  plan.channels = filteredChannels;
  await plan.save();
  console.log(`✓ Plan channels updated. Now managing ${filteredChannels.length} group(s):`);
  filteredChannels.forEach((c: { channelId: string; channelName: string }) =>
    console.log(`    ${c.channelName} (${c.channelId})`)
  );

  // ── Step 2: Delete BotSubscriber records for old channels ─────────────────
  const deleteResult = await BotSubscriber.deleteMany({
    channelId: { $in: OLD_CHANNEL_IDS },
  });
  console.log(`\n✓ Deleted ${deleteResult.deletedCount} BotSubscriber records for old channels`);

  // ── Step 3: Extend all active subscribers by 14 days ─────────────────────
  const activeSubs = await BotSubscriber.find({ status: "active" });
  const extendMs = EXTEND_DAYS * 24 * 60 * 60 * 1000;
  let extended = 0;

  for (const sub of activeSubs) {
    sub.expiryDate = new Date(sub.expiryDate.getTime() + extendMs);
    await sub.save();
    extended++;
  }
  console.log(`\n✓ Extended ${extended} active subscriber records by ${EXTEND_DAYS} days`);

  console.log("\n✅ Migration complete!");
  console.log("Next steps:");
  console.log("  1. Deploy to Vercel");
  console.log("  2. Make @Primetrexbot admin of the 3 new groups");
  console.log("  3. Run /addallusers in the bot to send invite links");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
