"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
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
  CalendarClock,
  Info,
} from "lucide-react";

// Returns next Friday date in WAT (UTC+1)
function getNextFriday(): Date {
  const nowWAT = new Date(Date.now() + 60 * 60 * 1000);
  const day = nowWAT.getUTCDay();
  const daysUntil = day <= 5 ? 5 - day : 6;
  const next = new Date(nowWAT);
  next.setUTCDate(nowWAT.getUTCDate() + daysUntil);
  next.setUTCHours(0, 0, 0, 0);
  return new Date(next.getTime() - 60 * 60 * 1000); // back to UTC
}

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

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Friday window check (client-side, WAT = UTC+1)
  const isFriday = useMemo(() => {
    const nowWAT = new Date(Date.now() + 60 * 60 * 1000);
    return nowWAT.getUTCDay() === 5;
  }, []);

  const nextFriday = useMemo(() => {
    const d = getNextFriday();
    return d.toLocaleDateString("en-NG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Africa/Lagos",
    });
  }, []);
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
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Bank-related state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksLoadFailed, setBanksLoadFailed] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
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
    if (showForm && banks.length === 0 && !banksLoadFailed) {
      setBanksLoading(true);
      fetch("/api/banks")
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (data?.banks) setBanks(data.banks);
          else setBanksLoadFailed(true);
        })
        .catch(() => setBanksLoadFailed(true))
        .finally(() => setBanksLoading(false));
    }
  }, [showForm, banks.length, banksLoadFailed]);

  // Auto-resolve account number when 10 digits entered and bank selected
  const resolveAccount = useCallback(
    async (accountNumber: string, bankCode: string) => {
      if (accountNumber.length !== 10 || !bankCode) return;
      setResolving(true);
      setResolveError("");
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
        } else {
          const msg = data.error || "Could not verify account.";
          setResolveError(`${msg} You can type the name manually.`);
        }
      } catch {
        setResolveError("Could not verify account. You can type the name manually.");
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

  async function handleWithdraw(e: { preventDefault(): void }) {
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
          "Withdrawal submitted! Your bank transfer is being processed by Korapay. You will be notified when it arrives."
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

  async function handleCancelWithdrawal(id: string) {
    setCancellingId(id);
    setFormSuccess("");
    try {
      const res = await fetch("/api/dashboard/withdraw/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId: id }),
      });
      if (res.ok) {
        setWithdrawals((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, status: "rejected", rejectionReason: "Cancelled by user" }
              : w
          )
        );
        setFormSuccess("Withdrawal cancelled successfully.");
      }
    } catch {
      // Silent fail
    } finally {
      setCancellingId(null);
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
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
            disabled={availableBalance < siteConfig.minWithdrawal || !isFriday}
            className="self-start sm:self-auto"
          >
            <Banknote className="h-4 w-4" />
            Request Withdrawal
          </Button>
        )}
      </div>

      {/* Withdrawal schedule banner */}
      <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${isFriday ? "bg-success/10 border border-success/30" : "bg-muted border border-border"}`}>
        <CalendarClock className={`h-5 w-5 shrink-0 mt-0.5 ${isFriday ? "text-success" : "text-muted-foreground"}`} />
        <div>
          {isFriday ? (
            <>
              <p className="font-semibold text-success">Today is withdrawal day!</p>
              <p className="text-muted-foreground mt-0.5">
                Submit your request now — payments are processed tomorrow (Saturday) and sent directly to your bank.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-foreground">Withdrawals are processed every Saturday</p>
              <p className="text-muted-foreground mt-0.5">
                Requests can only be submitted on <span className="font-medium text-foreground">Fridays</span>.
                {" "}Next window: <span className="font-medium text-foreground">{nextFriday}</span>.
              </p>
            </>
          )}
        </div>
      </div>

      {/* How it works note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          Submit your request on any Friday before midnight. Funds are transferred to your bank account every Saturday morning.
          You will receive an in-app notification and Telegram message when your transfer is completed.
        </span>
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
              ) : banksLoadFailed ? (
                <div className="space-y-2">
                  <p className="text-xs text-warning">
                    Bank list unavailable — enter your bank details manually.
                  </p>
                  <Input
                    label="Bank Name"
                    placeholder="e.g. Access Bank"
                    required
                    autoComplete="off"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                  <Input
                    label="Bank Code (3–6 digits)"
                    placeholder="e.g. 044"
                    required
                    autoComplete="off"
                    value={formData.bankCode}
                    onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search banks..."
                      value={bankSearch}
                      autoComplete="off"
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
                            setResolveError("");
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
                autoComplete="off"
                inputMode="numeric"
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    accountNumber: e.target.value.replace(/\D/g, ""),
                    accountName: "",
                  });
                  setResolveError("");
                }}
              />
              <div>
                <Input
                  label="Account Name"
                  placeholder={
                    resolving ? "Resolving..." : "Account holder name"
                  }
                  required
                  autoComplete="off"
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
                {resolveError && !resolving && (
                  <p className="text-xs text-warning mt-1">{resolveError}</p>
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
                className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                  w.status === "completed" ? "bg-success/10 text-success" :
                  w.status === "rejected" || w.status === "failed" ? "bg-danger/10 text-danger" :
                  "bg-warning/10 text-warning"
                }`}>
                  {w.status === "completed" ? <CheckCircle className="h-4 w-4" /> :
                   w.status === "rejected" || w.status === "failed" ? <Banknote className="h-4 w-4" /> :
                   <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {w.bankName} · {w.accountNumber}
                    </p>
                    <span className="text-sm font-bold text-foreground shrink-0">
                      {formatCurrency(w.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">
                      {new Date(w.date).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      w.status === "completed" ? "bg-success/10 text-success" :
                      w.status === "rejected" || w.status === "failed" ? "bg-danger/10 text-danger" :
                      w.status === "processing" ? "bg-primary/10 text-primary" :
                      "bg-warning/10 text-warning"
                    }`}>
                      {w.status}
                    </span>
                  </div>
                  {w.rejectionReason && (
                    <p className="text-xs text-danger mt-0.5">{w.rejectionReason}</p>
                  )}
                </div>
                {w.status === "pending" && (
                  <button
                    onClick={() => handleCancelWithdrawal(w.id)}
                    disabled={cancellingId === w.id}
                    className="shrink-0 text-xs font-medium text-danger border border-danger/30 rounded-lg px-3 py-1.5 hover:bg-danger/10 transition-colors disabled:opacity-50"
                  >
                    {cancellingId === w.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Cancel"
                    )}
                  </button>
                )}
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
