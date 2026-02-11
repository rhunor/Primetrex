"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  CreditCard,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TransactionItem {
  _id: string;
  type: string;
  amount: number;
  status: string;
  tier: number | null;
  description: string;
  paymentReference: string | null;
  userId: { firstName: string; lastName: string; email: string } | null;
  sourceUserId: { firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchTransactions = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          type: typeFilter,
        });

        const res = await fetch(`/api/admin/transactions?${params}`);
        const data = await res.json();
        if (res.ok) {
          setTransactions(data.transactions);
          setPagination(data.pagination);
        }
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    },
    [typeFilter]
  );

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const typeVariant: Record<string, "success" | "warning" | "info"> = {
    commission: "success",
    subscription: "info",
    withdrawal: "warning",
  };

  const statusVariant: Record<string, "success" | "warning" | "danger" | "info"> = {
    completed: "success",
    pending: "warning",
    processing: "info",
    rejected: "danger",
    failed: "danger",
  };

  const filters = [
    { label: "All", value: "all" },
    { label: "Commissions", value: "commission" },
    { label: "Subscriptions", value: "subscription" },
    { label: "Withdrawals", value: "withdrawal" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Transactions
        </h1>
        <p className="text-muted-foreground mt-1">
          All platform transactions
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === f.value
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Description
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx, i) => (
                    <motion.tr
                      key={tx._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-foreground">
                          {tx.userId
                            ? `${tx.userId.firstName} ${tx.userId.lastName}`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.userId?.email || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={typeVariant[tx.type] || "default"}>
                          {tx.type}
                          {tx.tier ? ` T${tx.tier}` : ""}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-foreground truncate max-w-[240px]">
                          {tx.description}
                        </p>
                        {tx.paymentReference && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {tx.paymentReference}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-foreground">
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={statusVariant[tx.status] || "default"}
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">
              No transactions found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
