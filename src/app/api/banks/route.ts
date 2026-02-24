import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listBanks, resolveAccount } from "@/lib/flutterwave-web";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountNumber = req.nextUrl.searchParams.get("account_number");
    const bankCode = req.nextUrl.searchParams.get("bank_code");

    // Resolve account if both params provided
    if (accountNumber && bankCode) {
      if (accountNumber.length !== 10) {
        return NextResponse.json(
          { error: "Account number must be 10 digits" },
          { status: 400 }
        );
      }

      const result = await resolveAccount(accountNumber, bankCode);
      return NextResponse.json({
        accountName: result.accountName,
        accountNumber: result.accountNumber,
      });
    }

    // List all banks
    const banks = await listBanks();
    const sorted = banks
      .map((b) => ({ name: b.name, code: b.code }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ banks: sorted });
  } catch (error) {
    console.error("Banks API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch banks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
