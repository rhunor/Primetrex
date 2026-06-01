import { NextRequest, NextResponse } from "next/server";
import { checkExpiredSubscriptions } from "@/bot/services/expiry";
import { checkAverisExpiry } from "@/bot/services/averis/groupManager";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [primetrex, averis] = await Promise.allSettled([
      checkExpiredSubscriptions(),
      process.env.AVERIS_MONGODB_URI
        ? checkAverisExpiry()
        : Promise.resolve({ expired: 0, reminders: 0 }),
    ]);

    return NextResponse.json({
      primetrex: primetrex.status === "fulfilled" ? primetrex.value : { error: String(primetrex.reason) },
      averis: averis.status === "fulfilled" ? averis.value : { error: String(averis.reason) },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Expiry cron error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
