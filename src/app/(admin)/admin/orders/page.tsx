"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  PackageSearch,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Wallet,
  Link2,
  X,
  Check,
} from "lucide-react";

interface TransactionItem {
  _id: string;
  type: string;
  amount: number;
  status: string;
  tier: number | null;
  orderId: string | null;
  paymentReference: string | null;
  description: string;
  userId: { _id: string; firstName: string; lastName: string; email: string } | null;
  sourceUserId: { _id: string; firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ModalType = "assign_affiliate" | "update_balance" | "link_affiliate" | null;

export default function AdminOrdersPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [modalInput, setModalInput] = useState({ affiliateCode: "", amount: "", userId: "", note: "" });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [modalError, setModalError] = useState("");

  const fetchTransactions = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20", type: typeFilter });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions);
        setPagination(data.pagination);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchTransactions(1); }, [fetchTransactions]);

  function openModal(type: ModalType, tx: TransactionItem) {
    setModal(type);
    setSelectedTx(tx);
    setModalInput({ affiliateCode: "", amount: "", userId: tx.userId?._id || "", note: "" });
    setModalMsg("");
    setModalError("");
  }

  function closeModal() {
    setModal(null);
    setSelectedTx(null);
    setModalMsg("");
    setModalError("");
  }

  async function handleModalSubmit() {
    if (!selectedTx || !modal) return;
    setModalLoading(true);
    setModalMsg("");
    setModalError("");

    let body: Record<string, unknown> = { action: modal };

    if (modal === "assign_affiliate") {
      body = { action: "assign_affiliate", affiliateReferralCode: modalInput.affiliateCode, commissionAmount: Number(modalInput.amount) };
    } else if (modal === "update_balance") {
      body = { action: "update_balance", userId: modalInput.userId, amount: Number(modalInput.amount), note: modalInput.note };
    } else if (modal === "link_affiliate") {
      body = { action: "link_affiliate_to_user", userId: modalInput.userId, affiliateReferralCode: modalInput.affiliateCode };
    }

    try {
      const res = await fetch(`/api/admin/orders/${selectedTx._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setModalMsg(data.message || "Success");
        fetchTransactions(pagination.page);
      } else {
        setModalError(data.error || "Operation failed");
      }
    } catch {
      setModalError("Something went wrong");
    } finally {
      setModalLoading(false);
    }
  }

  const typeVariant: Record<string, "success" | "warning" | "info"> = {
    commission: "success",
    subscription: "info",
    withdrawal: "warning",
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
        <h1 className="text-2xl font-bold font-heading text-foreground">Orders & Transactions</h1>
        <p className="text-muted-foreground mt-1">
          Track orders by ID, assign affiliates, and manually adjust user balances
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Order ID, reference, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === f.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Order / Reference</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
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
                        {tx.orderId ? (
                          <p className="text-xs font-bold font-mono text-primary">{tx.orderId}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No order ID</p>
                        )}
                        {tx.paymentReference && (
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate max-w-[160px]">{tx.paymentReference}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">{tx.description}</p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={typeVariant[tx.type] || "default"}>
                          {tx.type}{tx.tier ? ` T${tx.tier}` : ""}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {tx.userId ? (
                          <div>
                            <p className="text-sm font-medium text-foreground">{tx.userId.firstName} {tx.userId.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{tx.userId.email}</p>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(tx.amount)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openModal("assign_affiliate", tx)}
                            title="Assign affiliate commission"
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openModal("update_balance", tx)}
                            title="Update user balance"
                            className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                          >
                            <Wallet className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openModal("link_affiliate", tx)}
                            title="Link affiliate to user"
                            className="p-1.5 rounded-lg bg-info/10 text-info hover:bg-info/20 transition-colors"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchTransactions(pagination.page - 1)} disabled={pagination.page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fetchTransactions(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageSearch className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">No transactions found</p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {modal && selectedTx && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-50 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 sm:w-[480px] rounded-2xl bg-card border border-border shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold font-heading text-foreground">
                  {modal === "assign_affiliate" && "Assign Affiliate Commission"}
                  {modal === "update_balance" && "Update User Balance"}
                  {modal === "link_affiliate" && "Link Affiliate to User"}
                </h3>
                <button onClick={closeModal} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Order info */}
                <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
                  <p className="text-muted-foreground text-xs">Order: <span className="font-mono text-primary font-bold">{selectedTx.orderId || selectedTx._id}</span></p>
                  <p className="text-muted-foreground text-xs mt-0.5">{selectedTx.description}</p>
                </div>

                {modal === "assign_affiliate" && (
                  <>
                    <Input
                      label="Affiliate Referral Code"
                      placeholder="e.g. ABC123"
                      value={modalInput.affiliateCode}
                      onChange={(e) => setModalInput((p) => ({ ...p, affiliateCode: e.target.value.toUpperCase() }))}
                    />
                    <Input
                      label="Commission Amount (₦)"
                      type="number"
                      placeholder="e.g. 20000"
                      value={modalInput.amount}
                      onChange={(e) => setModalInput((p) => ({ ...p, amount: e.target.value }))}
                    />
                  </>
                )}

                {modal === "update_balance" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">User</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedTx.userId ? `${selectedTx.userId.firstName} ${selectedTx.userId.lastName} (${selectedTx.userId.email})` : "Unknown"}
                      </p>
                    </div>
                    <Input
                      label="Credit Amount (₦)"
                      type="number"
                      placeholder="e.g. 20000"
                      value={modalInput.amount}
                      onChange={(e) => setModalInput((p) => ({ ...p, amount: e.target.value }))}
                    />
                    <Input
                      label="Note (optional)"
                      placeholder="Reason for adjustment"
                      value={modalInput.note}
                      onChange={(e) => setModalInput((p) => ({ ...p, note: e.target.value }))}
                    />
                  </>
                )}

                {modal === "link_affiliate" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">User to Update</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedTx.userId ? `${selectedTx.userId.firstName} ${selectedTx.userId.lastName}` : "Unknown"}
                      </p>
                    </div>
                    <Input
                      label="Affiliate Referral Code"
                      placeholder="Referral code of the affiliate to link"
                      value={modalInput.affiliateCode}
                      onChange={(e) => setModalInput((p) => ({ ...p, affiliateCode: e.target.value.toUpperCase() }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will set the selected user&apos;s referrer to the affiliate with this code, enabling future commission tracking.
                    </p>
                  </>
                )}

                {modalMsg && (
                  <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-3 rounded-xl text-sm">
                    <Check className="h-4 w-4 shrink-0" />
                    {modalMsg}
                  </div>
                )}
                {modalError && (
                  <div className="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm">{modalError}</div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
                  <Button onClick={handleModalSubmit} isLoading={modalLoading} className="flex-1" disabled={!!modalMsg}>
                    Confirm
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
