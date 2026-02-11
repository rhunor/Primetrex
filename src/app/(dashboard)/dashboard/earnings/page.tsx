"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { EarningsChart } from "@/components/features/dashboard/earnings-chart";
import { TrendingUp, Wallet, ArrowUpRight, Layers, Loader2 } from "lucide-react";

interface EarningItem {
  id: string;
  amount: number;
  tier: number | null;
  description: string;
  date: string;
  status: string;
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [chartData, setChartData] = useState<{ month: string; tier1: number; tier2: number }[]>([]);
  const [stats, setStats] = useState({ total: 0, tier1: 0, tier2: 0, available: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setEarnings(data.earningsHistory || []);
          setChartData(data.chartData || []);
          setStats({
            total: data.stats.totalEarnings,
            tier1: data.stats.tier1Earnings,
            tier2: data.stats.tier2Earnings,
            available: data.stats.availableBalance,
          });
        }
      })
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Earnings</h1>
        <p className="text-muted-foreground mt-1">Track your commission earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Earned", value: formatCurrency(stats.total), icon: Wallet },
          { label: "Tier 1", value: formatCurrency(stats.tier1), icon: ArrowUpRight },
          { label: "Tier 2", value: formatCurrency(stats.tier2), icon: Layers },
          { label: "Available", value: formatCurrency(stats.available), icon: TrendingUp },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <s.icon className="h-5 w-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold font-heading text-foreground mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <EarningsChart data={chartData} />

      {/* History */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold font-heading text-foreground">Earnings History</h3>
        </div>

        {earnings.length > 0 ? (
          <div className="divide-y divide-border">
            {earnings.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(item.date).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {item.tier && (
                    <Badge variant={item.tier === 1 ? "info" : "success"}>
                      Tier {item.tier}
                    </Badge>
                  )}
                  <span className="text-sm font-bold text-secondary-dark">
                    +{formatCurrency(item.amount)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">No earnings yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Commissions will appear here when your referrals subscribe
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
