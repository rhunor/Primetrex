import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISpecialUser extends Document {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  addedAt: Date;
}

const SpecialUserSchema = new Schema<ISpecialUser>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, default: null },
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  addedAt: { type: Date, default: Date.now },
});

const SpecialUser: Model<ISpecialUser> =
  mongoose.models.SpecialUser ||
  mongoose.model<ISpecialUser>("SpecialUser", SpecialUserSchema);

export default SpecialUser;
