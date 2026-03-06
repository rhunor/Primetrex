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
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  isActive: boolean;
  telegramId: string | null;
  telegramLinked: boolean;
  profileImage: string | null;
  bankDetails: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  } | null;
  // 2FA fields
  knownDevices: { ip: string; lastSeen: Date }[];
  twoFAOTP: string | null;
  twoFAOTPExpires: Date | null;
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
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    isActive: { type: Boolean, default: false }, // Inactive until payment
    telegramId: { type: String, default: null },
    telegramLinked: { type: Boolean, default: false },
    profileImage: { type: String, default: null },
    bankDetails: {
      type: {
        bankName: String,
        bankCode: String,
        accountNumber: String,
        accountName: String,
      },
      default: null,
    },
    // 2FA: trusted devices (IP + last seen). OTP required if IP unknown or not seen in 30 days.
    knownDevices: {
      type: [{ ip: String, lastSeen: Date }],
      default: [],
    },
    twoFAOTP: { type: String, default: null },
    twoFAOTPExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ referredBy: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
