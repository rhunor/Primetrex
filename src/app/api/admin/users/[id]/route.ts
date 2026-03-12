import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user as unknown as Record<string, unknown>).role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { isSpecialAffiliate } = body;

    if (typeof isSpecialAffiliate !== "boolean") {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findByIdAndUpdate(
      id,
      { isSpecialAffiliate },
      { new: true, select: "isSpecialAffiliate" }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, isSpecialAffiliate: user.isSpecialAffiliate });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
