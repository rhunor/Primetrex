import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChannel {
  channelId: string;
  channelName: string;
}

export interface IPlan extends Document {
  name: string;
  price: number;
  renewalPrice: number;
  durationDays: number;
  channels: IChannel[];
  // Deprecated — kept for backward compat with old BotSubscriber records
  channelId: string;
  channelName: string;
  isActive: boolean;
  createdAt: Date;
}

const ChannelSchema = new Schema<IChannel>(
  {
    channelId: { type: String, required: true },
    channelName: { type: String, required: true },
  },
  { _id: false }
);

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    renewalPrice: { type: Number, required: true },
    durationDays: { type: Number, required: true, default: 30 },
    channels: { type: [ChannelSchema], default: [] },
    channelId: { type: String, default: "" },
    channelName: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>("Plan", PlanSchema);

export default Plan;
