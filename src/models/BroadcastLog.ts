import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBroadcastLog extends Document {
  message: string;
  target: "all" | "channel" | "dm";
  channelId?: string;
  dmTargetId?: string;
  successCount: number;
  failCount: number;
  failedUserIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastLogSchema = new Schema<IBroadcastLog>(
  {
    message: { type: String, required: true },
    target: { type: String, enum: ["all", "channel", "dm"], required: true },
    channelId: { type: String },
    dmTargetId: { type: String },
    successCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
    failedUserIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

const BroadcastLog: Model<IBroadcastLog> =
  mongoose.models.BroadcastLog ||
  mongoose.model<IBroadcastLog>("BroadcastLog", BroadcastLogSchema);

export default BroadcastLog;
