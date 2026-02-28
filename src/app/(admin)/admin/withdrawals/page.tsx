"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowDownUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  X,
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

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WithdrawalItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

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

  async function handleMarkPaid(w: WithdrawalItem) {
    setActionLoading(w._id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${w._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid" }),
      });
      if (res.ok) {
        setWithdrawals((prev) =>
          prev.map((item) =>
            item._id === w._id
              ? { ...item, status: "completed", processedAt: new Date().toISOString() }
              : item
          )
        );
      }
    } catch {
      // Silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectError("Please enter a reason");
      return;
    }
    setActionLoading(rejectTarget._id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${rejectTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: rejectReason }),
      });
      if (res.ok) {
        setWithdrawals((prev) =>
          prev.map((item) =>
            item._id === rejectTarget._id
              ? { ...item, status: "rejected", rejectionReason: rejectReason }
              : item
          )
        );
        setRejectTarget(null);
        setRejectReason("");
        setRejectError("");
      }
    } catch {
      // Silent
    } finally {
      setActionLoading(null);
    }
  }

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
          Review and process withdrawal requests
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

      {/* Rejection reason modal */}
      <AnimatePresence>
        {rejectTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold font-heading text-foreground">
                  Reject Withdrawal
                </h3>
                <button
                  onClick={() => { setRejectTarget(null); setRejectReason(""); setRejectError(""); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Rejecting <span className="font-medium text-foreground">{formatCurrency(rejectTarget.amount)}</span> for{" "}
                <span className="font-medium text-foreground">
                  {rejectTarget.userId
                    ? `${rejectTarget.userId.firstName} ${rejectTarget.userId.lastName}`
                    : "Unknown"}
                </span>
                . The user will be notified with this reason.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
                placeholder="e.g. Invalid bank details, please resubmit with correct account number"
                rows={3}
                className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              {rejectError && (
                <p className="text-xs text-danger mt-1">{rejectError}</p>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setRejectTarget(null); setRejectReason(""); setRejectError(""); }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 bg-danger hover:bg-danger/90 text-white"
                  onClick={handleRejectConfirm}
                  disabled={actionLoading === rejectTarget._id}
                >
                  {actionLoading === rejectTarget._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm Reject"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdrawals table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : withdrawals.length > 0 ? (
          <>
            {/* Mobile card list */}
            <div className="divide-y divide-border md:hidden">
              {withdrawals.map((w, i) => (
                <motion.div
                  key={w._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {w.userId
                          ? `${w.userId.firstName} ${w.userId.lastName}`
                          : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {w.bankName} · {w.accountNumber}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {w.accountName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{formatCurrency(w.amount)}</p>
                      <Badge variant={statusVariant[w.status] || "default"} className="mt-1">
                        {w.status}
                      </Badge>
                    </div>
                  </div>
                  {w.rejectionReason && (
                    <p className="text-xs text-danger mt-2">{w.rejectionReason}</p>
                  )}
                  {(w.status === "pending" || w.status === "processing") && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="primary"
                        className="flex-1 bg-success hover:bg-success/90 text-white"
                        onClick={() => handleMarkPaid(w)}
                        disabled={actionLoading === w._id}
                      >
                        {actionLoading === w._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><CheckCircle className="h-4 w-4" /> Mark as Paid</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-danger text-danger hover:bg-danger/10"
                        onClick={() => setRejectTarget(w)}
                        disabled={actionLoading === w._id}
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
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
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
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
                          {w.accountNumber} · {w.accountName}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-foreground">
                          {formatCurrency(w.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusVariant[w.status] || "default"}>
                          {w.status}
                        </Badge>
                        {w.rejectionReason && (
                          <p className="text-xs text-danger mt-1 max-w-40">
                            {w.rejectionReason}
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
                            Done:{" "}
                            {new Date(w.processedAt).toLocaleDateString(
                              "en-NG",
                              { day: "numeric", month: "short" }
                            )}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {(w.status === "pending" || w.status === "processing") ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-success hover:bg-success/90 text-white"
                              onClick={() => handleMarkPaid(w)}
                              disabled={actionLoading === w._id}
                            >
                              {actionLoading === w._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <><CheckCircle className="h-3.5 w-3.5" /> Paid</>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-danger text-danger hover:bg-danger/10"
                              onClick={() => setRejectTarget(w)}
                              disabled={actionLoading === w._id}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
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
