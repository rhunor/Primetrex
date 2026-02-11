import { NextRequest, NextResponse } from "next/server";
import { initializePayment, generatePaymentReference } from "@/lib/paystack";
import { siteConfig } from "@/config/site";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type, userId, referralCode } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const reference = generatePaymentReference();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let amount: number;
    let callbackUrl: string;

    if (type === "signup") {
      amount = siteConfig.signupFee * 100; // Convert to kobo
      callbackUrl = `${appUrl}/register/verify?reference=${reference}`;
    } else if (type === "subscription") {
      amount = siteConfig.subscription.price * 100;
      callbackUrl = `${appUrl}/dashboard?payment=success&reference=${reference}`;
    } else {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      );
    }

    const response = await initializePayment({
      email,
      amount,
      reference,
      callbackUrl,
      metadata: {
        type,
        userId: userId || null,
        referralCode: referralCode || null,
      },
    });

    return NextResponse.json({
      authorizationUrl: response.data.authorization_url,
      reference: response.data.reference,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
