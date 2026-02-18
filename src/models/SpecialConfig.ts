import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISpecialConfig extends Document {
  discountType: "fixed" | "percentage";
  discountValue: number;
}

const SpecialConfigSchema = new Schema<ISpecialConfig>({
  discountType: {
    type: String,
    enum: ["fixed", "percentage"],
    default: "fixed",
  },
  discountValue: { type: Number, default: 5000 },
});

const SpecialConfig: Model<ISpecialConfig> =
  mongoose.models.SpecialConfig ||
  mongoose.model<ISpecialConfig>("SpecialConfig", SpecialConfigSchema);

export default SpecialConfig;
