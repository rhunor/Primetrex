import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBotAdmin extends Document {
  userId: string;
  role: "owner" | "admin";
}

const BotAdminSchema = new Schema<IBotAdmin>({
  userId: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ["owner", "admin"],
    default: "admin",
  },
});

const BotAdmin: Model<IBotAdmin> =
  mongoose.models.BotAdmin ||
  mongoose.model<IBotAdmin>("BotAdmin", BotAdminSchema);

export default BotAdmin;
