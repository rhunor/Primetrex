import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "rejected" | "failed";
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  transferCode: string | null;
  paystackReference: string | null;
  rejectionReason: string | null;
  processedAt: Date | null;
  processedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 10000 },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected", "failed"],
      default: "pending",
    },
    bankName: { type: String, required: true },
    bankCode: { type: String, default: "" },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    transferCode: { type: String, default: null },
    paystackReference: { type: String, default: null },
    rejectionReason: { type: String, default: null },
    processedAt: { type: Date, default: null },
    processedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

WithdrawalSchema.index({ userId: 1, status: 1, createdAt: -1 });

const Withdrawal: Model<IWithdrawal> =
  mongoose.models.Withdrawal ||
  mongoose.model<IWithdrawal>("Withdrawal", WithdrawalSchema);

export default Withdrawal;
