import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Withdrawal from "@/models/Withdrawal";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as unknown as Record<string, unknown>).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      verifiedEmails,
      totalRevenue,
      totalCommissions,
      pendingWithdrawals,
      completedWithdrawals,
      recentUsers,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", isActive: true }),
      User.countDocuments({ role: "user", isActive: false }),
      User.countDocuments({ role: "user", isEmailVerified: true }),
      Transaction.aggregate([
        { $match: { type: "subscription", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "commission", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Withdrawal.aggregate([
        { $match: { status: { $in: ["pending", "processing"] } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Withdrawal.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.find({ role: "user" })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("firstName lastName email isActive hasPaidSignup isEmailVerified createdAt")
        .lean(),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "firstName lastName email")
        .lean(),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        verifiedEmails,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCommissions: totalCommissions[0]?.total || 0,
        pendingWithdrawals: {
          amount: pendingWithdrawals[0]?.total || 0,
          count: pendingWithdrawals[0]?.count || 0,
        },
        completedWithdrawals: completedWithdrawals[0]?.total || 0,
      },
      recentUsers,
      recentTransactions,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
