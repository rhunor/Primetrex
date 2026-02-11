import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  tier: 1 | 2;
  status: "pending" | "active" | "inactive" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tier: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "expired"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
ReferralSchema.index({ referrerId: 1, tier: 1 });
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ referredUserId: 1 });

const Referral: Model<IReferral> =
  mongoose.models.Referral ||
  mongoose.model<IReferral>("Referral", ReferralSchema);

export default Referral;
