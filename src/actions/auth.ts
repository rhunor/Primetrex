"use server";

import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Referral from "@/models/Referral";
import { registerSchema } from "@/schemas/auth";
import { generateReferralCode } from "@/lib/utils";

export async function registerUser(formData: FormData) {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    referralCode: formData.get("referralCode") || undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await dbConnect();

  // Check if user exists
  const existingUser = await User.findOne({ email: parsed.data.email });
  if (existingUser) {
    return { error: { email: ["An account with this email already exists"] } };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  // Generate unique referral code
  let referralCode = generateReferralCode();
  while (await User.findOne({ referralCode })) {
    referralCode = generateReferralCode();
  }

  // Find referrer if referral code provided
  let referredBy = null;
  if (parsed.data.referralCode) {
    const referrer = await User.findOne({
      referralCode: parsed.data.referralCode.toUpperCase(),
    });
    if (referrer) {
      referredBy = referrer._id;
    }
  }

  // Create user
  const user = await User.create({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email,
    passwordHash,
    referralCode,
    referredBy,
  });

  // Create Tier 1 referral record
  if (referredBy) {
    await Referral.create({
      referrerId: referredBy,
      referredUserId: user._id,
      tier: 1,
      status: "pending",
    });

    // Check if the referrer was also referred by someone (Tier 2)
    const referrer = await User.findById(referredBy);
    if (referrer?.referredBy) {
      await Referral.create({
        referrerId: referrer.referredBy,
        referredUserId: user._id,
        tier: 2,
        status: "pending",
      });
    }
  }

  return { success: true };
}
