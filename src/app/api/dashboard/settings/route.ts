import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;
    const body = await req.json();

    await dbConnect();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update bank details
    if (body.bankDetails) {
      const { bankName, bankCode, accountNumber, accountName } = body.bankDetails;
      if (!bankName || !accountNumber || !accountName) {
        return NextResponse.json(
          { error: "All bank fields are required" },
          { status: 400 }
        );
      }
      user.bankDetails = { bankName, bankCode: bankCode || "", accountNumber, accountName };
      // Reset recipient code if bank details change
      if (
        user.bankDetails?.bankCode !== bankCode ||
        user.bankDetails?.accountNumber !== accountNumber
      ) {
        user.paystackRecipientCode = null;
      }
      await user.save();
      return NextResponse.json({ success: true, message: "Bank details updated" });
    }

    // Change password
    if (body.password) {
      const { currentPassword, newPassword } = body.password;

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Both current and new passwords are required" },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      user.passwordHash = await bcrypt.hash(newPassword, 12);
      await user.save();
      return NextResponse.json({ success: true, message: "Password changed" });
    }

    return NextResponse.json({ error: "No valid update provided" }, { status: 400 });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json(
      { error: "Settings update failed" },
      { status: 500 }
    );
  }
}
