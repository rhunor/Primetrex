import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: "commission" | "withdrawal" | "subscription";
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "rejected" | "failed";
  tier: 1 | 2 | null;
  referralId: mongoose.Types.ObjectId | null;
  sourceUserId: mongoose.Types.ObjectId | null;
  paymentReference: string | null;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["commission", "withdrawal", "subscription"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected", "failed"],
      default: "pending",
    },
    tier: { type: Number, enum: [1, 2, null], default: null },
    referralId: {
      type: Schema.Types.ObjectId,
      ref: "Referral",
      default: null,
    },
    sourceUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    paymentReference: { type: String, default: null },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Indexes for dashboard queries
TransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, status: 1 });
TransactionSchema.index({ paymentReference: 1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
