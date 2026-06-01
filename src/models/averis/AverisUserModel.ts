/**
 * Read-only view of Averis Academy's User collection.
 * Only the fields the bot needs — schema must stay compatible with averisaffiliate/src/models/User.ts
 */
import mongoose, { Schema } from "mongoose";
import { connectAverisDb } from "@/lib/averisDb";

export interface IAverisUser {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  referralCode: string;
  isActive: boolean;
  hasPaidSignup: boolean;
  subscriptionExpiresAt: Date | null;
  telegramId: string | null;
  telegramLinked: boolean;
}

const schema = new Schema<IAverisUser>(
  {
    firstName: String,
    lastName: String,
    email: { type: String, lowercase: true },
    referralCode: String,
    isActive: Boolean,
    hasPaidSignup: Boolean,
    subscriptionExpiresAt: { type: Date, default: null },
    telegramId: { type: String, default: null },
    telegramLinked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

let _model: mongoose.Model<IAverisUser> | null = null;

export async function getAverisUserModel(): Promise<mongoose.Model<IAverisUser>> {
  const conn = await connectAverisDb();
  if (!_model) {
    // Must use the same collection name as in the Averis app ("users")
    _model = conn.models.User ?? conn.model<IAverisUser>("User", schema);
  }
  return _model;
}
