import dbConnect from "@/lib/db";
import Coupon, { ICoupon } from "@/models/Coupon";

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discountAmount: number;
  finalAmount: number;
  discountLabel: string;
  coupon?: ICoupon;
}

/**
 * Validate a coupon code and calculate the discount against a base amount.
 * Pass userId (Telegram ID or web user ID) to enforce one-use-per-person.
 * Does NOT increment timesUsed — call applyCouponUsage() after successful payment.
 */
export async function validateCoupon(
  code: string,
  baseAmount: number,
  userId?: string
): Promise<CouponValidationResult> {
  await dbConnect();

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code.", discountAmount: 0, finalAmount: baseAmount, discountLabel: "" };
  }

  if (!coupon.isActive) {
    return { valid: false, error: "This coupon is no longer active.", discountAmount: 0, finalAmount: baseAmount, discountLabel: "" };
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, error: "This coupon has expired.", discountAmount: 0, finalAmount: baseAmount, discountLabel: "" };
  }

  if (coupon.maxUses !== null && coupon.timesUsed >= coupon.maxUses) {
    return { valid: false, error: "This coupon has reached its maximum uses.", discountAmount: 0, finalAmount: baseAmount, discountLabel: "" };
  }

  // Per-user check — prevent same person using the same coupon twice
  if (userId && coupon.usedBy.includes(userId)) {
    return { valid: false, error: "You have already used this coupon.", discountAmount: 0, finalAmount: baseAmount, discountLabel: "" };
  }

  let discountAmount = 0;
  let discountLabel = "";

  if (coupon.discountType === "fixed") {
    discountAmount = Math.min(coupon.discountValue, baseAmount);
    discountLabel = `₦${coupon.discountValue.toLocaleString("en-NG")} off`;
  } else {
    discountAmount = Math.round((baseAmount * coupon.discountValue) / 100);
    discountLabel = `${coupon.discountValue}% off`;
  }

  const finalAmount = Math.max(baseAmount - discountAmount, 0);

  return { valid: true, discountAmount, finalAmount, discountLabel, coupon };
}

/**
 * Increment timesUsed and record userId on a coupon after a successful payment.
 */
export async function applyCouponUsage(code: string, userId?: string): Promise<void> {
  await dbConnect();
  await Coupon.updateOne(
    { code: code.toUpperCase().trim() },
    {
      $inc: { timesUsed: 1 },
      ...(userId ? { $addToSet: { usedBy: userId } } : {}),
    }
  );
}
