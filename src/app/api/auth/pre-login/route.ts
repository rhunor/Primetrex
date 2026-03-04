import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendOTPEmail } from "@/lib/email";

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

    // Intentionally vague error to prevent user enumeration
    if (!user) {
      return NextResponse.json({ needsOTP: false }, { status: 200 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ needsOTP: false }, { status: 200 });
    }

    const ip = getClientIP(req);

    // Known IP — no OTP needed
    if (ip !== "unknown" && user.knownIPs?.includes(ip)) {
      return NextResponse.json({ needsOTP: false });
    }

    // New IP — generate and send OTP
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
