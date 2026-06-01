import mongoose, { Schema } from "mongoose";
import { connectAverisDb } from "@/lib/averisDb";

export interface IAverisSubscriber {
  _id: mongoose.Types.ObjectId;
  telegramId: string;
  averisUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  groupId: string;
  expiryDate: Date;
  status: "active" | "expired";
  remindersSent: string[];
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAverisSubscriber>(
  {
    telegramId: { type: String, required: true, unique: true },
    averisUserId: { type: String, required: true },
    email: { type: String, required: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    groupId: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "expired"], default: "active" },
    remindersSent: { type: [String], default: [] },
    removedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

schema.index({ status: 1, expiryDate: 1 });

let _model: mongoose.Model<IAverisSubscriber> | null = null;

export async function getAverisSubscriberModel(): Promise<mongoose.Model<IAverisSubscriber>> {
  const conn = await connectAverisDb();
  if (!_model) {
    _model = conn.models.AverisSubscriber ?? conn.model<IAverisSubscriber>("AverisSubscriber", schema);
  }
  return _model;
}
