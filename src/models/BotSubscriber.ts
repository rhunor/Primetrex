import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBotSubscriber extends Document {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  planId: mongoose.Types.ObjectId;
  channelId: string;
  startDate: Date;
  expiryDate: Date;
  status: "active" | "expired" | "cancelled";
  addedBy: "payment" | "manual" | "special";
  createdAt: Date;
  updatedAt: Date;
}

const BotSubscriberSchema = new Schema<IBotSubscriber>(
  {
    userId: { type: String, required: true },
    username: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    channelId: { type: String, required: true },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    addedBy: {
      type: String,
      enum: ["payment", "manual", "special"],
      default: "payment",
    },
  },
  { timestamps: true }
);

BotSubscriberSchema.index({ userId: 1, channelId: 1 });
BotSubscriberSchema.index({ status: 1, expiryDate: 1 });

const BotSubscriber: Model<IBotSubscriber> =
  mongoose.models.BotSubscriber ||
  mongoose.model<IBotSubscriber>("BotSubscriber", BotSubscriberSchema);

export default BotSubscriber;
