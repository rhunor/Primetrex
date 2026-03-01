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

    // Monthly window: last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      verifiedEmails,
      totalRevenue,
      totalCommissions,
      pendingWithdrawals,
      completedWithdrawals,
      failedWithdrawals,
      recentUsers,
      recentTransactions,
      monthlyRevenue,
      monthlyCommissions,
      monthlyWithdrawals,
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
      Withdrawal.aggregate([
        { $match: { status: { $in: ["failed", "rejected"] } } },
        { $group: { _id: null, count: { $sum: 1 } } },
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
      // Monthly subscription revenue
      Transaction.aggregate([
        { $match: { type: "subscription", status: "completed", createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      // Monthly commissions paid
      Transaction.aggregate([
        { $match: { type: "commission", status: "completed", createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      // Monthly withdrawals completed
      Withdrawal.aggregate([
        { $match: { status: "completed", processedAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$processedAt" }, month: { $month: "$processedAt" } }, total: { $sum: "$amount" } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    // Build last-6-months chart data
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const chartMonths: { month: string; revenue: number; commissions: number; withdrawals: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const label = `${monthNames[m - 1]} ${y !== new Date().getFullYear() ? y : ""}`.trim();
      chartMonths.push({
        month: label,
        revenue: (monthlyRevenue as Array<{ _id: { year: number; month: number }; total: number }>).find((r) => r._id.year === y && r._id.month === m)?.total || 0,
        commissions: (monthlyCommissions as Array<{ _id: { year: number; month: number }; total: number }>).find((r) => r._id.year === y && r._id.month === m)?.total || 0,
        withdrawals: (monthlyWithdrawals as Array<{ _id: { year: number; month: number }; total: number }>).find((r) => r._id.year === y && r._id.month === m)?.total || 0,
      });
    }

    const totalRevenueVal = totalRevenue[0]?.total || 0;
    const totalCommissionsVal = totalCommissions[0]?.total || 0;
    const completedWithdrawalsVal = completedWithdrawals[0]?.total || 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        verifiedEmails,
        totalRevenue: totalRevenueVal,
        totalCommissions: totalCommissionsVal,
        pendingWithdrawals: {
          amount: pendingWithdrawals[0]?.total || 0,
          count: pendingWithdrawals[0]?.count || 0,
        },
        completedWithdrawals: completedWithdrawalsVal,
        failedWithdrawals: failedWithdrawals[0]?.count || 0,
        // Net platform balance = revenue collected - withdrawals paid out
        // (commissions are internal ledger entries, not real cash out)
        netBalance: totalRevenueVal - completedWithdrawalsVal,
      },
      financialChart: chartMonths,
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
