"use client";

import { motion } from "motion/react";
import { formatCurrency } from "@/lib/utils";
import { Users, Wallet, ArrowUpRight, Layers } from "lucide-react";

interface StatsCardsProps {
  totalEarnings: number;
  activeReferrals: number;
  tier1Earnings: number;
  tier2Earnings: number;
}

export function StatsCards({
  totalEarnings,
  activeReferrals,
  tier1Earnings,
  tier2Earnings,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {/* Hero card — Total Earnings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="col-span-2 lg:col-span-1 rounded-2xl gradient-primary p-5 lg:p-6 shadow-lg shadow-primary/25"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60 bg-white/10 px-2.5 py-1 rounded-full">
            All time
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-white/70 uppercase tracking-wider">
            Total Earnings
          </p>
          <p className="mt-1 text-2xl lg:text-2xl font-bold font-heading text-white">
            {formatCurrency(totalEarnings)}
          </p>
        </div>
      </motion.div>

      {/* Active Referrals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="rounded-2xl border border-border bg-card p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-3 lg:mt-4">
          <p className="text-xs text-muted-foreground">Active Referrals</p>
          <p className="mt-1 text-2xl font-bold font-heading text-foreground">
            {activeReferrals}
          </p>
        </div>
      </motion.div>

      {/* Tier 1 Earnings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="rounded-2xl border border-border bg-card p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20">
          <ArrowUpRight className="h-5 w-5 text-secondary-dark" />
        </div>
        <div className="mt-3 lg:mt-4">
          <p className="text-xs text-muted-foreground">Tier 1 Earnings</p>
          <p className="mt-1 text-xl lg:text-2xl font-bold font-heading text-foreground">
            {formatCurrency(tier1Earnings)}
          </p>
        </div>
      </motion.div>

      {/* Tier 2 Earnings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="rounded-2xl border border-border bg-card p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
          <Layers className="h-5 w-5 text-warning" />
        </div>
        <div className="mt-3 lg:mt-4">
          <p className="text-xs text-muted-foreground">Tier 2 Earnings</p>
          <p className="mt-1 text-xl lg:text-2xl font-bold font-heading text-foreground">
            {formatCurrency(tier2Earnings)}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
