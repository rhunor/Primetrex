import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendOTPEmail } from "@/lib/email";

const DEVICE_TRUST_DAYS = 30;

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Intentionally vague — prevents user enumeration
    if (!user) {
      return NextResponse.json({ needsOTP: false }, { status: 200 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ needsOTP: false }, { status: 200 });
    }

    const ip = getClientIP(req);
    const cutoff = new Date(Date.now() - DEVICE_TRUST_DAYS * 24 * 60 * 60 * 1000);

    const knownDevice = ip !== "unknown"
      ? user.knownDevices?.find((d: { ip: string; lastSeen: Date }) => d.ip === ip)
      : null;

    // Known device seen within the last 30 days — no OTP, just refresh lastSeen
    if (knownDevice && new Date(knownDevice.lastSeen) > cutoff) {
      await User.updateOne(
        { _id: user._id, "knownDevices.ip": ip },
        { $set: { "knownDevices.$.lastSeen": new Date() } }
      );
      return NextResponse.json({ needsOTP: false });
    }

    // Unknown device or device not seen in 30 days — send OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.twoFAOTP = otp;
    user.twoFAOTPExpires = expires;
    await user.save();

    await sendOTPEmail(user.email, user.firstName, otp).catch(() => {});

    return NextResponse.json({ needsOTP: true });
  } catch (error) {
    console.error("pre-login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
