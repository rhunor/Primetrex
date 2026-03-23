import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupon";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, amount } = await req.json();
  if (!code || typeof amount !== "number") {
    return NextResponse.json({ error: "Missing code or amount." }, { status: 400 });
  }

  const result = await validateCoupon(code, amount, session.user.id);
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    discountAmount: result.discountAmount,
    finalAmount: result.finalAmount,
    discountLabel: result.discountLabel,
  });
}
