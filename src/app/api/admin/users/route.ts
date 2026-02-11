import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Referral from "@/models/Referral";
import Transaction from "@/models/Transaction";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as unknown as Record<string, unknown>).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
    const search = req.nextUrl.searchParams.get("search") || "";
    const filter = req.nextUrl.searchParams.get("filter") || "all";

    await dbConnect();

    const query: Record<string, unknown> = { role: "user" };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { referralCode: { $regex: search, $options: "i" } },
      ];
    }

    if (filter === "active") query.isActive = true;
    else if (filter === "inactive") query.isActive = false;
    else if (filter === "paid") query.hasPaidSignup = true;
    else if (filter === "unpaid") query.hasPaidSignup = false;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "firstName lastName email referralCode isActive hasPaidSignup isEmailVerified telegramLinked bankDetails createdAt"
        )
        .lean(),
      User.countDocuments(query),
    ]);

    // Get referral counts for each user
    const userIds = users.map((u) => u._id);
    const referralCounts = await Referral.aggregate([
      { $match: { referrerId: { $in: userIds }, tier: 1 } },
      { $group: { _id: "$referrerId", count: { $sum: 1 } } },
    ]);
    const referralMap = new Map(
      referralCounts.map((r) => [r._id.toString(), r.count])
    );

    // Get earnings for each user
    const earningsAgg = await Transaction.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          type: "commission",
          status: "completed",
        },
      },
      { $group: { _id: "$userId", total: { $sum: "$amount" } } },
    ]);
    const earningsMap = new Map(
      earningsAgg.map((e) => [e._id.toString(), e.total])
    );

    const enrichedUsers = users.map((u) => ({
      ...u,
      referralCount: referralMap.get(u._id.toString()) || 0,
      totalEarnings: earningsMap.get(u._id.toString()) || 0,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
