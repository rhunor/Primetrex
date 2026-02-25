import { NextRequest, NextResponse } from "next/server";
import {
  initializePayment,
  generateWebTxRef,
} from "@/lib/flutterwave-web";
import { siteConfig } from "@/config/site";

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

    const txRef = generateWebTxRef();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // No query params in redirect_url — Flutterwave always appends ?status=&tx_ref=&transaction_id=
    // If we include ?tx_ref= here, Flutterwave appends a second ? making the URL malformed
    const redirectUrl = `${appUrl}/register/verify`;

    const paymentUrl = await initializePayment({
      txRef,
      amount: siteConfig.signupFee,
      email,
      name: name || email,
      description: "Primetrex Affiliate Signup Fee",
      redirectUrl,
      meta: {
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
