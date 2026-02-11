import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Referral from "@/models/Referral";
import { generateReferralCode } from "@/lib/utils";

const registerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input. Please check your details." },
        { status: 400 }
      );
    }

    if (parsed.data.password !== parsed.data.confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check existing user
    const existingUser = await User.findOne({ email: parsed.data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    // Generate unique referral code
    let referralCode = generateReferralCode();
    while (await User.findOne({ referralCode })) {
      referralCode = generateReferralCode();
    }

    // Find referrer
    let referredBy = null;
    if (parsed.data.referralCode) {
      const referrer = await User.findOne({
        referralCode: parsed.data.referralCode.toUpperCase(),
      });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Create user (inactive until payment)
    const user = await User.create({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      passwordHash,
      referralCode,
      referredBy,
      isActive: false,
      hasPaidSignup: false,
    });

    // Create Tier 1 referral record (pending until payment)
    if (referredBy) {
      await Referral.create({
        referrerId: referredBy,
        referredUserId: user._id,
        tier: 1,
        status: "pending",
      });

      // Tier 2: check if the referrer was also referred
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

    return NextResponse.json({ success: true, userId: user._id.toString() });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
