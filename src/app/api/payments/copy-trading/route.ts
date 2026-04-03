import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CopyTradingPayment from "@/models/CopyTradingPayment";
import { initializeCharge } from "@/lib/korapay";

const COPY_TRADING_PRICE = 50000;

function generateCopyTradingRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PTXW-COPY-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, referralCode } = await req.json();

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    await dbConnect();

    const paymentRef = generateCopyTradingRef();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await CopyTradingPayment.create({
      paymentRef,
      buyerName: name.trim(),
      buyerEmail: email.trim().toLowerCase(),
      referralCode: referralCode?.trim().toUpperCase() || null,
      amount: COPY_TRADING_PRICE,
      status: "pending",
    });

    const checkoutUrl = await initializeCharge({
      reference: paymentRef,
      amount: COPY_TRADING_PRICE,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      narration: "Primetrex Copy Trading Access",
      redirectUrl: `${appUrl}/copy-trading/success`,
      metadata: {
        type: "copy_trading",
        ...(referralCode ? { referralCode: referralCode.trim().toUpperCase() } : {}),
      },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("Copy trading payment init error:", error);
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}
