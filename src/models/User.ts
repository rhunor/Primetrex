import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  referralCode: string;
  referredBy: mongoose.Types.ObjectId | null;
  hasPaidSignup: boolean;
  signupPaymentRef: string | null;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  isActive: boolean;
  telegramId: string | null;
  telegramLinked: boolean;
  profileImage: string | null;
  paystackRecipientCode: string | null;
  bankDetails: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    referralCode: { type: String, required: true, unique: true },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hasPaidSignup: { type: Boolean, default: false },
    signupPaymentRef: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    isActive: { type: Boolean, default: false }, // Inactive until payment
    telegramId: { type: String, default: null },
    telegramLinked: { type: Boolean, default: false },
    profileImage: { type: String, default: null },
    paystackRecipientCode: { type: String, default: null },
    bankDetails: {
      type: {
        bankName: String,
        bankCode: String,
        accountNumber: String,
        accountName: String,
      },
      default: null,
    },
  },
  { timestamps: true }
);

UserSchema.index({ referredBy: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
