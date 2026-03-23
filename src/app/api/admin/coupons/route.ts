import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";

type SessionUser = Record<string, unknown>;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as unknown as SessionUser).role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();

  const { code, discountType, discountValue, expiresAt } = await req.json();

  if (!code || !discountType || discountValue == null) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!["fixed", "percentage"].includes(discountType)) {
    return NextResponse.json({ error: "Invalid discountType." }, { status: 400 });
  }
  if (discountType === "percentage" && (discountValue <= 0 || discountValue > 100)) {
    return NextResponse.json({ error: "Percentage must be between 1 and 100." }, { status: 400 });
  }

  const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (existing) {
    return NextResponse.json({ error: "Coupon code already exists." }, { status: 400 });
  }

  // Each coupon is single-use: maxUses is always 1
  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    discountType,
    discountValue: Number(discountValue),
    maxUses: 1,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  return NextResponse.json({ coupon }, { status: 201 });
}
