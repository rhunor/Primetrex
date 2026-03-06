import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !user.twoFAOTP || !user.twoFAOTPExpires) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    if (new Date() > user.twoFAOTPExpires) {
      user.twoFAOTP = null;
      user.twoFAOTPExpires = null;
      await user.save();
      return NextResponse.json({ error: "Code expired. Please try again." }, { status: 400 });
    }

    if (user.twoFAOTP !== otp.trim()) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // OTP verified — upsert IP into knownDevices with current timestamp
    const ip = getClientIP(req);
    user.twoFAOTP = null;
    user.twoFAOTPExpires = null;

    if (ip !== "unknown") {
      const devices: { ip: string; lastSeen: Date }[] = user.knownDevices ?? [];
      const idx = devices.findIndex((d) => d.ip === ip);
      if (idx >= 0) {
        devices[idx].lastSeen = new Date();
      } else {
        devices.push({ ip, lastSeen: new Date() });
      }
      user.knownDevices = devices;
    }

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
