import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  maxUses: number | null;
  timesUsed: number;
  usedBy: string[]; // Telegram IDs or web user IDs — prevents same person using twice
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    maxUses: { type: Number, default: null },
    timesUsed: { type: Number, default: 0 },
    usedBy: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);

export default Coupon;
