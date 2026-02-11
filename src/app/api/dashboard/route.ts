import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Referral from "@/models/Referral";
import Transaction from "@/models/Transaction";
import Withdrawal from "@/models/Withdrawal";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;

    await dbConnect();

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all data in parallel
    const [
      tier1Referrals,
      tier2Referrals,
      commissions,
      withdrawals,
      recentReferralDocs,
    ] = await Promise.all([
      Referral.find({ referrerId: userId, tier: 1 })
        .populate("referredUserId", "firstName lastName email")
        .lean(),
      Referral.find({ referrerId: userId, tier: 2 })
        .populate("referredUserId", "firstName lastName email")
        .lean(),
      Transaction.find({ userId, type: "commission", status: "completed" }).lean(),
      Withdrawal.find({ userId }).sort({ createdAt: -1 }).lean(),
      Referral.find({ referrerId: userId })
        .populate("referredUserId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Calculate stats
    const tier1Earnings = commissions
      .filter((c) => c.tier === 1)
      .reduce((sum, c) => sum + c.amount, 0);
    const tier2Earnings = commissions
      .filter((c) => c.tier === 2)
      .reduce((sum, c) => sum + c.amount, 0);
    const totalEarnings = tier1Earnings + tier2Earnings;

    const activeReferrals = [...tier1Referrals, ...tier2Referrals].filter(
      (r) => r.status === "active"
    ).length;

    const totalWithdrawn = withdrawals
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + w.amount, 0);
    const pendingWithdrawals = withdrawals
      .filter((w) => w.status === "pending" || w.status === "processing")
      .reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalEarnings - totalWithdrawn - pendingWithdrawals;

    // Build monthly chart data (last 6 months)
    const now = new Date();
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = date.toLocaleString("default", { month: "short" });

      const monthCommissions = commissions.filter((c) => {
        const d = new Date(c.createdAt);
        return d >= date && d <= monthEnd;
      });

      chartData.push({
        month: monthLabel,
        tier1: monthCommissions
          .filter((c) => c.tier === 1)
          .reduce((sum, c) => sum + c.amount, 0),
        tier2: monthCommissions
          .filter((c) => c.tier === 2)
          .reduce((sum, c) => sum + c.amount, 0),
      });
    }

    // Format recent referrals
    const recentReferrals = recentReferralDocs.map((r) => {
      const referred = r.referredUserId as unknown as {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      const referralEarnings = commissions
        .filter((c) => c.sourceUserId?.toString() === referred._id.toString())
        .reduce((sum, c) => sum + c.amount, 0);

      return {
        id: r._id.toString(),
        name: `${referred.firstName} ${referred.lastName}`,
        email: referred.email,
        tier: r.tier,
        status: r.status,
        earnings: referralEarnings,
        date: r.createdAt,
      };
    });

    // Format all referrals for the referrals page
    const allReferrals = [...tier1Referrals, ...tier2Referrals].map((r) => {
      const referred = r.referredUserId as unknown as {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      const referralEarnings = commissions
        .filter((c) => c.sourceUserId?.toString() === referred._id.toString())
        .reduce((sum, c) => sum + c.amount, 0);

      return {
        id: r._id.toString(),
        name: `${referred.firstName} ${referred.lastName}`,
        email: referred.email,
        tier: r.tier,
        status: r.status,
        earnings: referralEarnings,
        date: r.createdAt,
      };
    });

    // Format earnings history
    const earningsHistory = commissions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => ({
        id: c._id.toString(),
        amount: c.amount,
        tier: c.tier,
        description: c.description,
        date: c.createdAt,
        status: c.status,
      }));

    // Format withdrawals
    const withdrawalHistory = withdrawals.map((w) => ({
      id: w._id.toString(),
      amount: w.amount,
      status: w.status,
      bankName: w.bankName,
      accountNumber: w.accountNumber,
      accountName: w.accountName,
      rejectionReason: w.rejectionReason,
      date: w.createdAt,
      processedAt: w.processedAt,
    }));

    return NextResponse.json({
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        referralCode: user.referralCode,
        initials: `${user.firstName[0]}${user.lastName[0]}`,
        bankDetails: user.bankDetails,
        telegramLinked: user.telegramLinked || false,
      },
      stats: {
        totalEarnings,
        tier1Earnings,
        tier2Earnings,
        activeReferrals,
        totalReferrals: tier1Referrals.length + tier2Referrals.length,
        availableBalance,
        totalWithdrawn,
        pendingWithdrawals,
      },
      chartData,
      recentReferrals,
      allReferrals,
      earningsHistory,
      withdrawalHistory,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
