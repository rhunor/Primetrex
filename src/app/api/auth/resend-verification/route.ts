import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Generate a fresh token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      { emailVerificationToken, emailVerificationExpires }
    );

    await sendVerificationEmail(user.email, user.firstName, emailVerificationToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }
}
