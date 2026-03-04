import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Referral from "@/models/Referral";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/orders/[id]
 * Allows admin to:
 * 1. Assign an affiliate to a transaction (connect referrer to a commission)
 * 2. Update a user's balance by creating a manual commission transaction
 * 3. Link an affiliate to a user (set referredBy)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as unknown as Record<string, unknown>).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    await dbConnect();

    if (action === "assign_affiliate") {
      // Assign an affiliate (by referral code) to receive commission for this transaction
      const { affiliateReferralCode, commissionAmount } = body;
      if (!affiliateReferralCode || commissionAmount == null) {
        return NextResponse.json({ error: "affiliateReferralCode and commissionAmount are required" }, { status: 400 });
      }

      const affiliate = await User.findOne({ referralCode: affiliateReferralCode });
      if (!affiliate) {
        return NextResponse.json({ error: "Affiliate not found with that referral code" }, { status: 404 });
      }

      const tx = await Transaction.findById(id);
      if (!tx) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      // Create a manual commission transaction for the affiliate
      const manualTx = await Transaction.create({
        userId: affiliate._id,
        type: "commission",
        amount: Number(commissionAmount),
        tier: 1,
        status: "completed",
        sourceUserId: tx.userId,
        paymentReference: tx.paymentReference,
        orderId: tx.orderId,
        description: `Manual commission assignment by admin (Order: ${tx.orderId || id})`,
        metadata: { adminAssigned: true, originalTxId: id },
      });

      return NextResponse.json({
        success: true,
        message: `Commission of ₦${Number(commissionAmount).toLocaleString()} assigned to ${affiliate.firstName} ${affiliate.lastName}`,
        transaction: manualTx,
      });
    }

    if (action === "update_balance") {
      // Manually credit or adjust a user's balance
      const { userId, amount, note } = body;
      if (!userId || amount == null) {
        return NextResponse.json({ error: "userId and amount are required" }, { status: 400 });
      }

      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const manualTx = await Transaction.create({
        userId: user._id,
        type: "commission",
        amount: Number(amount),
        tier: 1,
        status: "completed",
        paymentReference: null,
        orderId: `ADMIN-${Date.now()}`,
        description: note || `Manual balance adjustment by admin`,
        metadata: { adminAdjustment: true },
      });

      return NextResponse.json({
        success: true,
        message: `Balance updated: ₦${Number(amount).toLocaleString()} credited to ${user.firstName} ${user.lastName}`,
        transaction: manualTx,
      });
    }

    if (action === "link_affiliate_to_user") {
      // Set a user's referredBy to a given affiliate
      const { userId, affiliateReferralCode } = body;
      if (!userId || !affiliateReferralCode) {
        return NextResponse.json({ error: "userId and affiliateReferralCode are required" }, { status: 400 });
      }

      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const affiliate = await User.findOne({ referralCode: affiliateReferralCode });
      if (!affiliate) {
        return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
      }

      if (affiliate._id.toString() === user._id.toString()) {
        return NextResponse.json({ error: "User cannot be their own affiliate" }, { status: 400 });
      }

      // Update referredBy
      user.referredBy = affiliate._id as typeof user.referredBy;
      await user.save();

      // Create or update the Referral record
      await Referral.findOneAndUpdate(
        { referrerId: affiliate._id, referredUserId: user._id, tier: 1 },
        { referrerId: affiliate._id, referredUserId: user._id, tier: 1, status: user.isActive ? "active" : "pending" },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: `${user.firstName} ${user.lastName} is now linked to affiliate ${affiliate.firstName} ${affiliate.lastName} (${affiliateReferralCode})`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
