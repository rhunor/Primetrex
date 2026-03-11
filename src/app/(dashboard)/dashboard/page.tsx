"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { StatsCards } from "@/components/features/dashboard/stats-cards";
import { ReferralLinkCard } from "@/components/features/dashboard/referral-link-card";
import { CommissionInfo } from "@/components/features/dashboard/tier-progress";
import { formatCurrency } from "@/lib/utils";
import { Loader2, TrendingUp, ExternalLink } from "lucide-react";

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
  chartData?: { month: string; tier1: number; tier2: number }[];
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

      {/* Affiliate Community Banner */}
      <motion.a
        href="https://t.me/Primetrexaffiliates"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center justify-between gap-4 rounded-2xl border border-[#229ED9]/30 bg-[#229ED9]/8 px-6 py-4 hover:bg-[#229ED9]/15 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#229ED9]/20 text-[#229ED9] shrink-0">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.07 9.763c-.155.695-.567.865-1.148.539l-3.17-2.335-1.53 1.473c-.17.17-.312.312-.637.312l.226-3.218 5.85-5.284c.254-.226-.055-.352-.394-.126L7.29 14.37l-3.11-.973c-.676-.21-.69-.676.141-.999l12.165-4.692c.563-.204 1.056.137.876.542z"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Join the Affiliate Community</p>
            <p className="text-xs text-muted-foreground">Connect with other affiliates, get tips &amp; updates on Telegram</p>
          </div>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
      </motion.a>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReferralLinkCard referralCode={data.user.referralCode} />
        <CommissionInfo />
      </div>
    </div>
  );
}
