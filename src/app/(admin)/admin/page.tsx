"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  TrendingUp,
  ArrowDownUp,
  Clock,
  Loader2,
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
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
      label: "Completed Withdrawals",
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
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
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
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {tx.userId
                      ? `${tx.userId.firstName} ${tx.userId.lastName}`
                      : "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {tx.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
