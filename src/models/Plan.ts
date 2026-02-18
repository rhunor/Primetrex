import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlan extends Document {
  name: string;
  price: number;
  renewalPrice: number;
  durationDays: number;
  channelId: string;
  channelName: string;
  isActive: boolean;
  createdAt: Date;
}

const PlanSchema = new Schema<IPlan>(
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

const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);

export default Plan;
