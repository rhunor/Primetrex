import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Look up by token only — check expiry separately so we can give better errors
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification link. The link may have expired — please request a new one." },
        { status: 400 }
      );
    }

    // Already verified — idempotent success (covers the "second click" case)
    if (user.isEmailVerified) {
      return NextResponse.json({ success: true, message: "Email already verified" });
    }

    // Token expired
    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return NextResponse.json(
        { error: "This verification link has expired. Please request a new verification email." },
        { status: 400 }
      );
    }

    user.isEmailVerified = true;
    // Keep the token so repeat clicks still return success (token expires naturally)
    await user.save();

    return NextResponse.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
