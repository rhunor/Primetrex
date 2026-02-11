"use client";

import { motion } from "motion/react";
import { formatCurrency } from "@/lib/utils";
import { Users, Wallet, ArrowUpRight, Layers } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  index: number;
}

function StatCard({ title, value, icon: Icon, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold font-heading text-foreground">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

interface StatsCardsProps {
  totalEarnings: number;
  activeReferrals: number;
  tier1Earnings: number;
  tier2Earnings: number;
}

export function StatsCards({ totalEarnings, activeReferrals, tier1Earnings, tier2Earnings }: StatsCardsProps) {
  const stats = [
    { title: "Total Earnings", value: formatCurrency(totalEarnings), icon: Wallet },
    { title: "Active Referrals", value: String(activeReferrals), icon: Users },
    { title: "Tier 1 Earnings", value: formatCurrency(tier1Earnings), icon: ArrowUpRight },
    { title: "Tier 2 Earnings", value: formatCurrency(tier2Earnings), icon: Layers },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} {...stat} index={index} />
      ))}
    </div>
  );
}
