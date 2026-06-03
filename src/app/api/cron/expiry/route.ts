import { NextRequest, NextResponse } from "next/server";
import { checkAverisExpiry } from "@/bot/services/averis/groupManager";

// Primetrex expiry check preserved — re-enable by importing checkExpiredSubscriptions
// from "@/bot/services/expiry" and adding it back to the Promise.allSettled call

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = process.env.AVERIS_MONGODB_URI
      ? await checkAverisExpiry()
      : { expired: 0, reminders: 0 };

    return NextResponse.json({ averis: result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Expiry cron error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
