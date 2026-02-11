import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listBanks, resolveAccount } from "@/lib/paystack";

// GET: List all Nigerian banks or resolve an account number
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountNumber = req.nextUrl.searchParams.get("account_number");
    const bankCode = req.nextUrl.searchParams.get("bank_code");

    // If account_number and bank_code provided, resolve the account
    if (accountNumber && bankCode) {
      if (accountNumber.length !== 10) {
        return NextResponse.json(
          { error: "Account number must be 10 digits" },
          { status: 400 }
        );
      }

      const result = await resolveAccount(accountNumber, bankCode);
      return NextResponse.json({
        accountName: result.data.account_name,
        accountNumber: result.data.account_number,
      });
    }

    // Otherwise, list all banks
    const result = await listBanks();
    const banks = result.data
      .filter((b) => b.active)
      .map((b) => ({
        name: b.name,
        code: b.code,
        slug: b.slug,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ banks });
  } catch (error) {
    console.error("Banks API error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch banks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
