"use client";

import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  month: string;
  tier1: number;
  tier2: number;
}

interface EarningsChartProps {
  data: ChartDataPoint[];
}

export function EarningsChart({ data }: EarningsChartProps) {
  const hasData = data.some((d) => d.tier1 > 0 || d.tier2 > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold font-heading text-foreground">
            Earnings Overview
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monthly earnings breakdown by tier
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Tier 1
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-dark" />
            Tier 2
          </span>
        </div>
      </div>

      {hasData ? (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tier1Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8808CC" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8808CC" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tier2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1DBA2B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1DBA2B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e1eb" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e1eb", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
                formatter={(value) => [`₦${Number(value).toLocaleString()}`, ""]}
                labelStyle={{ fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="tier1" stroke="#8808CC" strokeWidth={2} fill="url(#tier1Gradient)" name="Tier 1" />
              <Area type="monotone" dataKey="tier2" stroke="#1DBA2B" strokeWidth={2} fill="url(#tier2Gradient)" name="Tier 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
          No earnings data yet. Start referring to see your chart!
        </div>
      )}
    </motion.div>
  );
}
