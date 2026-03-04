"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { StatsCards } from "@/components/features/dashboard/stats-cards";
import { ReferralLinkCard } from "@/components/features/dashboard/referral-link-card";
import { EarningsChart } from "@/components/features/dashboard/earnings-chart";
import { CommissionInfo } from "@/components/features/dashboard/tier-progress";
import { formatCurrency } from "@/lib/utils";
import { Loader2, TrendingUp } from "lucide-react";

function getGreeting(firstName: string) {
  const hour = new Date().getHours();
  const time = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${time}, ${firstName}`;
}

interface DashboardData {
  user: { name: string; referralCode: string };
  stats: {
    totalEarnings: number;
    tier1Earnings: number;
    tier2Earnings: number;
    activeReferrals: number;
  };
  chartData: { month: string; tier1: number; tier2: number }[];
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

  const firstName = data.user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Atmospheric welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-sidebar px-6 py-7 lg:px-8"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-primary/30 blur-[70px]" />
        <div aria-hidden="true" className="pointer-events-none absolute right-40 -bottom-6 h-36 w-36 rounded-full bg-secondary/20 blur-[50px]" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/3 top-0 h-24 w-24 rounded-full bg-primary-dark/50 blur-[35px]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Affiliate Dashboard</p>
            <h1 className="mt-1 text-balance text-2xl lg:text-3xl font-bold font-heading text-white">
              {getGreeting(firstName)}
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Here&apos;s your affiliate performance overview
            </p>
          </div>
          {data.stats.totalEarnings > 0 && (
            <div className="hidden sm:flex flex-col items-end shrink-0 gap-1">
              <div className="flex items-center gap-1.5 text-white/30">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                <p className="text-[10px] uppercase tracking-wider">All-time earnings</p>
              </div>
              <p className="text-2xl font-bold font-heading text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(data.stats.totalEarnings)}
              </p>
              <span className="inline-flex items-center rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                {data.stats.activeReferrals} active referrals
              </span>
            </div>
          )}
        </div>
      </motion.div>

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
    </div>
  );
}
