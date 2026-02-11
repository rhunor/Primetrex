"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import {
  Wallet,
  Loader2,
  Banknote,
  Clock,
  CheckCircle,
  Search,
} from "lucide-react";

interface WithdrawalItem {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  rejectionReason: string | null;
  date: string;
  processedAt: string | null;
}

interface Bank {
  name: string;
  code: string;
  slug: string;
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

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Bank-related state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setWithdrawals(data.withdrawalHistory || []);
          setAvailableBalance(data.stats.availableBalance);
          setTotalWithdrawn(data.stats.totalWithdrawn);
          if (data.user.bankDetails) {
            setFormData((prev) => ({
              ...prev,
              bankCode: data.user.bankDetails.bankCode || "",
              bankName: data.user.bankDetails.bankName || "",
              accountNumber: data.user.bankDetails.accountNumber || "",
              accountName: data.user.bankDetails.accountName || "",
            }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load banks when form is shown
  useEffect(() => {
    if (showForm && banks.length === 0) {
      setBanksLoading(true);
      fetch("/api/banks")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.banks) setBanks(data.banks);
        })
        .catch(() => {})
        .finally(() => setBanksLoading(false));
    }
  }, [showForm, banks.length]);

  // Auto-resolve account number when 10 digits entered and bank selected
  const resolveAccount = useCallback(
    async (accountNumber: string, bankCode: string) => {
      if (accountNumber.length !== 10 || !bankCode) return;
      setResolving(true);
      try {
        const res = await fetch(
          `/api/banks?account_number=${accountNumber}&bank_code=${bankCode}`
        );
        const data = await res.json();
        if (res.ok && data.accountName) {
          setFormData((prev) => ({
            ...prev,
            accountName: data.accountName,
          }));
        }
      } catch {
        // Silent fail — user can still enter name manually
      } finally {
        setResolving(false);
      }
    },
    []
  );

  useEffect(() => {
    if (formData.accountNumber.length === 10 && formData.bankCode) {
      resolveAccount(formData.accountNumber, formData.bankCode);
    }
  }, [formData.accountNumber, formData.bankCode, resolveAccount]);

  const filteredBanks = bankSearch
    ? banks.filter((b) =>
        b.name.toLowerCase().includes(bankSearch.toLowerCase())
      )
    : banks;

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const amount = Number(formData.amount);
    if (amount < siteConfig.minWithdrawal) {
      setFormError(
        `Minimum withdrawal is ${formatCurrency(siteConfig.minWithdrawal)}`
      );
      return;
    }
    if (amount > availableBalance) {
      setFormError("Insufficient balance");
      return;
    }
    if (!formData.bankCode) {
      setFormError("Please select a bank");
      return;
    }
    if (!formData.accountName) {
      setFormError("Account name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Withdrawal request failed");
      } else {
        setFormSuccess(
          "Withdrawal is being processed! You will be notified when it completes."
        );
        setShowForm(false);
        setAvailableBalance((prev) => prev - amount);
        setWithdrawals((prev) => [data.withdrawal, ...prev]);
        setFormData((prev) => ({ ...prev, amount: "" }));
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Withdrawals
          </h1>
          <p className="text-muted-foreground mt-1">
            Request and track your withdrawals
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            disabled={availableBalance < siteConfig.minWithdrawal}
          >
            <Banknote className="h-4 w-4" />
            Request Withdrawal
          </Button>
        )}
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border-2 border-primary bg-card p-5">
          <Wallet className="h-5 w-5 text-primary mb-2" />
          <p className="text-xs text-muted-foreground">Available Balance</p>
          <p className="text-2xl font-bold font-heading gradient-text mt-1">
            {formatCurrency(availableBalance)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <CheckCircle className="h-5 w-5 text-secondary-dark mb-2" />
          <p className="text-xs text-muted-foreground">Total Withdrawn</p>
          <p className="text-2xl font-bold font-heading text-foreground mt-1">
            {formatCurrency(totalWithdrawn)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Clock className="h-5 w-5 text-warning mb-2" />
          <p className="text-xs text-muted-foreground">Min. Withdrawal</p>
          <p className="text-2xl font-bold font-heading text-foreground mt-1">
            {formatCurrency(siteConfig.minWithdrawal)}
          </p>
        </div>
      </div>

      {formSuccess && (
        <div className="bg-success/10 text-success px-4 py-3 rounded-xl text-sm font-medium">
          {formSuccess}
        </div>
      )}

      {/* Withdrawal form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold font-heading text-foreground mb-4">
            Request Withdrawal
          </h3>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <Input
              label={`Amount (min ${formatCurrency(siteConfig.minWithdrawal)})`}
              type="number"
              placeholder="Enter amount"
              required
              min={siteConfig.minWithdrawal}
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />

            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Select Bank
              </label>
              {banksLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading banks...
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search banks..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                    {filteredBanks.length > 0 ? (
                      filteredBanks.map((bank) => (
                        <button
                          key={bank.code}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              bankCode: bank.code,
                              bankName: bank.name,
                              accountName: "",
                            });
                            setBankSearch("");
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${
                            formData.bankCode === bank.code
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground"
                          }`}
                        >
                          {bank.name}
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-muted-foreground">
                        No banks found
                      </p>
                    )}
                  </div>
                  {formData.bankName && (
                    <p className="text-xs text-primary mt-1.5">
                      Selected: {formData.bankName}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Account Number"
                placeholder="10-digit number"
                required
                maxLength={10}
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accountNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
              <div>
                <Input
                  label="Account Name"
                  placeholder={
                    resolving ? "Resolving..." : "Account holder name"
                  }
                  required
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountName: e.target.value,
                    })
                  }
                  disabled={resolving}
                />
                {resolving && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verifying account...
                  </p>
                )}
              </div>
            </div>

            {formError && (
              <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-lg">
                {formError}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" isLoading={submitting}>
                Submit Request
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* History */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold font-heading text-foreground">
            Withdrawal History
          </h3>
        </div>

        {withdrawals.length > 0 ? (
          <div className="divide-y divide-border">
            {withdrawals.map((w, index) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {w.bankName} — {w.accountNumber}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(w.date).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {w.rejectionReason && (
                    <p className="text-xs text-danger mt-0.5">
                      {w.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant[w.status] || "default"}>
                    {w.status}
                  </Badge>
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(w.amount)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">
              No withdrawals yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Request a withdrawal once you have at least{" "}
              {formatCurrency(siteConfig.minWithdrawal)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
