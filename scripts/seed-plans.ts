import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    renewalPrice: { type: Number, required: true },
    durationDays: { type: Number, required: true, default: 30 },
    channelId: { type: String, required: true },
    channelName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);

const plans = [
  {
    name: "Primetrex Standard",
    price: 15000, // ₦15,000 first-time
    renewalPrice: 10000, // ₦10,000 renewal
    durationDays: 30,
    channelId: "-1003879775166", // TODO: Replace with your actual Telegram channel ID
    channelName: "Primetrex Signals",
    isActive: true,
  },
  // Add more plans as needed:
  // {
  //   name: "Primetrex Premium",
  //   price: 25000,
  //   renewalPrice: 20000,
  //   durationDays: 30,
  //   channelId: "-100XXXXXXXXXX",
  //   channelName: "Primetrex Premium Signals",
  //   isActive: true,
  // },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // Clear existing plans (optional — remove this line if you want to keep existing ones)
  await Plan.deleteMany({});
  console.log("Cleared existing plans");

  const result = await Plan.insertMany(plans);
  console.log(`Seeded ${result.length} plan(s):`);
  result.forEach((p: any) => {
    console.log(`  - ${p.name}: ₦${p.price} / ₦${p.renewalPrice} renewal (${p.durationDays} days)`);
  });

  await mongoose.disconnect();
  console.log("Done!");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
