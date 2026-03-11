import { NextRequest, NextResponse } from "next/server";
import {
  initializeCharge,
  generateWebTxRef,
} from "@/lib/korapay";
import { siteConfig } from "@/config/site";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// Simple in-memory rate limiter (resets per serverless instance)
const ipLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const max = 3;
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const now = Date.now();
  const entry = ipLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many payment requests. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, name, referralCode } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Look up user and store txRef on their record before redirecting to Flutterwave.
    // This allows verify to find the user by txRef — Flutterwave checkout lets customers
    // change their email during payment, so customer.email in the verify response may not
    // match the email stored in the database.
    await dbConnect();
    const lowerEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      console.error("[initialize] User not found for email:", lowerEmail);
      return NextResponse.json(
        { error: "Account not found. Please complete registration first." },
        { status: 404 }
      );
    }

    if (user.hasPaidSignup) {
      return NextResponse.json(
        { error: "This account has already been activated. Please sign in." },
        { status: 409 }
      );
    }

    const txRef = generateWebTxRef();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // Korapay appends ?reference=YOUR_REFERENCE to the redirect URL
    const redirectUrl = `${appUrl}/register/verify`;

    // Store txRef on the user before they're redirected to Korapay
    await User.updateOne({ _id: user._id }, { signupPaymentRef: txRef });

    const paymentUrl = await initializeCharge({
      reference: txRef,
      amount: siteConfig.signupFee,
      email: lowerEmail,
      name: name || lowerEmail,
      narration: "Primetrex Affiliate Signup Fee",
      redirectUrl,
      metadata: {
        type: "signup",
        referralCode: referralCode || null,
      },
    });

    return NextResponse.json({ paymentUrl, txRef });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
