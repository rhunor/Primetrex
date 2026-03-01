"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  TrendingUp,
  ArrowDownUp,
  Clock,
  Loader2,
  TrendingDown,
  Scale,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedEmails: number;
  totalRevenue: number;
  totalCommissions: number;
  pendingWithdrawals: { amount: number; count: number };
  completedWithdrawals: number;
  failedWithdrawals: number;
  netBalance: number;
}

interface ChartMonth {
  month: string;
  revenue: number;
  commissions: number;
  withdrawals: number;
}

interface RecentUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  hasPaidSignup: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

interface RecentTransaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  tier: number | null;
  description: string;
  userId: { firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}

// Currency formatter for chart axis (compact: ₦50k, ₦1m)
function formatAxisCurrency(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}k`;
  return `₦${value}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [financialChart, setFinancialChart] = useState<ChartMonth[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setFinancialChart(data.financialChart || []);
        setRecentUsers(data.recentUsers || []);
        setRecentTransactions(data.recentTransactions || []);
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

  if (!stats) return null;

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      icon: UserCheck,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Inactive Users",
      value: stats.inactiveUsers,
      icon: UserX,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-secondary-dark",
      bg: "bg-secondary/10",
    },
    {
      label: "Total Commissions Paid",
      value: formatCurrency(stats.totalCommissions),
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending Withdrawals",
      value: `${stats.pendingWithdrawals.count} (${formatCurrency(stats.pendingWithdrawals.amount)})`,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Withdrawals Paid Out",
      value: formatCurrency(stats.completedWithdrawals),
      icon: ArrowDownUp,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  const txTypeVariant: Record<string, "success" | "warning" | "info"> = {
    commission: "success",
    subscription: "info",
    withdrawal: "warning",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Admin Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your platform at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className={`inline-flex p-2 rounded-xl ${card.bg} mb-3`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-xl font-bold font-heading text-foreground mt-1">
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Financial Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold font-heading text-foreground">
            Financial Overview
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Platform cash flow — last 6 months
          </p>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
              <TrendingUp className="h-5 w-5 text-secondary-dark" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Inflow</p>
              <p className="text-lg font-bold font-heading text-foreground">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-[10px] text-muted-foreground">Subscription fees collected</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 shrink-0">
              <TrendingDown className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Outflow</p>
              <p className="text-lg font-bold font-heading text-foreground">
                {formatCurrency(stats.completedWithdrawals)}
              </p>
              <p className="text-[10px] text-muted-foreground">Withdrawals paid to affiliates</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${stats.netBalance >= 0 ? "bg-success/10" : "bg-danger/10"}`}>
              <Scale className={`h-5 w-5 ${stats.netBalance >= 0 ? "text-success" : "text-danger"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Balance</p>
              <p className={`text-lg font-bold font-heading ${stats.netBalance >= 0 ? "text-success" : "text-danger"}`}>
                {formatCurrency(Math.abs(stats.netBalance))}
              </p>
              <p className="text-[10px] text-muted-foreground">Revenue minus paid-out withdrawals</p>
            </div>
          </div>
        </div>

        {/* Commissions note */}
        <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{formatCurrency(stats.totalCommissions)}</span> in affiliate commissions are recorded as internal ledger entries.
            These become payable when affiliates request withdrawals.
            {stats.pendingWithdrawals.count > 0 && (
              <span className="text-warning font-medium">
                {" "}{stats.pendingWithdrawals.count} withdrawal{stats.pendingWithdrawals.count > 1 ? "s" : ""} ({formatCurrency(stats.pendingWithdrawals.amount)}) pending this Friday's batch.
              </span>
            )}
          </p>
        </div>

        {/* Monthly bar chart */}
        <div className="p-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialChart} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tickFormatter={formatAxisCurrency} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenue (inflow)" fill="#9AFFA3" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commissions" name="Commissions (ledger)" fill="#8808CC" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" name="Withdrawals (outflow)" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card shadow-sm"
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold font-heading text-foreground">
              Recent Signups
            </h3>
          </div>
          <div className="divide-y divide-border">
            {recentUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={user.isActive ? "success" : "warning"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No users yet
              </p>
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border bg-card shadow-sm"
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold font-heading text-foreground">
              Recent Transactions
            </h3>
          </div>
          <div className="divide-y divide-border">
            {recentTransactions.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.userId
                      ? `${tx.userId.firstName} ${tx.userId.lastName}`
                      : "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tx.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={txTypeVariant[tx.type] || "default"}>
                    {tx.type}
                  </Badge>
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No transactions yet
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
