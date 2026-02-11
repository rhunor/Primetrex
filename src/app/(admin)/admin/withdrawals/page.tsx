"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowDownUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface WithdrawalItem {
  _id: string;
  amount: number;
  status: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  transferCode: string | null;
  paystackReference: string | null;
  rejectionReason: string | null;
  processedAt: string | null;
  userId: { firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchWithdrawals = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          status: statusFilter,
        });

        const res = await fetch(`/api/admin/withdrawals?${params}`);
        const data = await res.json();
        if (res.ok) {
          setWithdrawals(data.withdrawals);
          setPagination(data.pagination);
        }
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchWithdrawals(1);
  }, [fetchWithdrawals]);

  const statusVariant: Record<
    string,
    "success" | "warning" | "danger" | "info"
  > = {
    completed: "success",
    pending: "warning",
    processing: "info",
    rejected: "danger",
    failed: "danger",
  };

  const filters = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Processing", value: "processing" },
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Withdrawals
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor all withdrawal requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Withdrawals table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : withdrawals.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Bank Details
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {withdrawals.map((w, i) => (
                    <motion.tr
                      key={w._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-foreground">
                          {w.userId
                            ? `${w.userId.firstName} ${w.userId.lastName}`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {w.userId?.email || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-foreground">{w.bankName}</p>
                        <p className="text-xs text-muted-foreground">
                          {w.accountNumber} - {w.accountName}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-foreground">
                          {formatCurrency(w.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={statusVariant[w.status] || "default"}
                        >
                          {w.status}
                        </Badge>
                        {w.rejectionReason && (
                          <p className="text-xs text-danger mt-1">
                            {w.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {w.paystackReference ? (
                          <p className="text-xs text-muted-foreground font-mono">
                            {w.paystackReference}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                        {w.transferCode && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {w.transferCode}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(w.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {w.processedAt && (
                          <p className="text-xs text-success mt-0.5">
                            Processed:{" "}
                            {new Date(w.processedAt).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </p>
                        )}
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
                    onClick={() => fetchWithdrawals(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchWithdrawals(pagination.page + 1)}
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
            <ArrowDownUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">
              No withdrawals found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
