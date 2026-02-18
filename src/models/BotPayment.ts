import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBotPayment extends Document {
  userId: string;
  planId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentRef: string | null;
  flwRef: string | null;
  status: "pending" | "successful" | "failed";
  paymentType: "new" | "renewal";
  createdAt: Date;
  updatedAt: Date;
}

const BotPaymentSchema = new Schema<IBotPayment>(
  {
    userId: { type: String, required: true },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    paymentRef: { type: String, default: null },
    flwRef: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
    },
    paymentType: {
      type: String,
      enum: ["new", "renewal"],
      required: true,
    },
  },
  { timestamps: true }
);

BotPaymentSchema.index({ paymentRef: 1 });
BotPaymentSchema.index({ userId: 1, status: 1 });

const BotPayment: Model<IBotPayment> =
  mongoose.models.BotPayment ||
  mongoose.model<IBotPayment>("BotPayment", BotPaymentSchema);

export default BotPayment;
