import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Withdrawal from "@/models/Withdrawal";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;
    const { withdrawalId } = await req.json();

    if (!withdrawalId) {
      return NextResponse.json({ error: "Withdrawal ID required" }, { status: 400 });
    }

    await dbConnect();
    const withdrawal = await Withdrawal.findOne({ _id: withdrawalId, userId });

    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending withdrawals can be cancelled." },
        { status: 400 }
      );
    }

    withdrawal.status = "rejected";
    withdrawal.rejectionReason = "Cancelled by user";
    await withdrawal.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel withdrawal error:", error);
    return NextResponse.json({ error: "Failed to cancel withdrawal" }, { status: 500 });
  }
}
