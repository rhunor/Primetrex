import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICopyTradingPayment extends Document {
  paymentRef: string;
  buyerName: string;
  buyerEmail: string;
  referralCode: string | null;
  amount: number;
  status: "pending" | "successful";
  orderId: string | null;
  createdAt: Date;
}

const CopyTradingPaymentSchema = new Schema<ICopyTradingPayment>(
  {
    paymentRef: { type: String, required: true, unique: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    referralCode: { type: String, default: null },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "successful"], default: "pending" },
    orderId: { type: String, default: null },
  },
  { timestamps: true }
);

const CopyTradingPayment: Model<ICopyTradingPayment> =
  mongoose.models.CopyTradingPayment ||
  mongoose.model<ICopyTradingPayment>("CopyTradingPayment", CopyTradingPaymentSchema);

export default CopyTradingPayment;
