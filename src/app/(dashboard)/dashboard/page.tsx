"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/features/dashboard/stats-cards";
import { ReferralLinkCard } from "@/components/features/dashboard/referral-link-card";
import { EarningsChart } from "@/components/features/dashboard/earnings-chart";
import { CommissionInfo } from "@/components/features/dashboard/tier-progress";
import { RecentReferrals } from "@/components/features/dashboard/recent-referrals";
import { Loader2 } from "lucide-react";

interface DashboardData {
  user: { name: string; referralCode: string };
  stats: {
    totalEarnings: number;
    tier1Earnings: number;
    tier2Earnings: number;
    activeReferrals: number;
  };
  chartData: { month: string; tier1: number; tier2: number }[];
  recentReferrals: {
    id: string;
    name: string;
    email: string;
    tier: number;
    status: string;
    earnings: number;
    date: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-32 text-muted-foreground">
        Failed to load dashboard data. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {data.user.name.split(" ")[0]}! Here&apos;s your affiliate performance.
        </p>
      </div>

      <StatsCards
        totalEarnings={data.stats.totalEarnings}
        activeReferrals={data.stats.activeReferrals}
        tier1Earnings={data.stats.tier1Earnings}
        tier2Earnings={data.stats.tier2Earnings}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EarningsChart data={data.chartData} />
        </div>
        <div className="space-y-6">
          <ReferralLinkCard referralCode={data.user.referralCode} />
          <CommissionInfo />
        </div>
      </div>

      <RecentReferrals referrals={data.recentReferrals} />
    </div>
  );
}
