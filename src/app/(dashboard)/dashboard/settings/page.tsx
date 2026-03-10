"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  CreditCard,
  Lock,
  Loader2,
  Check,
  Search,
  MessageCircle,
  Copy,
  LinkIcon,
  Unlink,
} from "lucide-react";

interface Bank {
  name: string;
  code: string;
  slug: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Bank-related state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [bankSearch, setBankSearch] = useState("");

  // Telegram state
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setReferralCode(data.user.referralCode || "");
          setTelegramLinked(data.user.telegramLinked || false);
          if (data.user.bankDetails) {
            setBankDetails({
              bankName: data.user.bankDetails.bankName || "",
              bankCode: data.user.bankDetails.bankCode || "",
              accountNumber: data.user.bankDetails.accountNumber || "",
              accountName: data.user.bankDetails.accountName || "",
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load banks on mount
  useEffect(() => {
    setBanksLoading(true);
    fetch("/api/banks")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.banks) setBanks(data.banks);
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, []);

  // Auto-resolve account
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
          setBankDetails((prev) => ({
            ...prev,
            accountName: data.accountName,
          }));
        } else {
          setResolveError("Could not verify account. Please enter name manually.");
        }
      } catch {
        setResolveError("Could not verify account. Please enter name manually.");
      } finally {
        setResolving(false);
      }
    },
    []
  );

  useEffect(() => {
    if (bankDetails.accountNumber.length === 10 && bankDetails.bankCode) {
      resolveAccount(bankDetails.accountNumber, bankDetails.bankCode);
    }
  }, [bankDetails.accountNumber, bankDetails.bankCode, resolveAccount]);

  const filteredBanks = bankSearch
    ? banks.filter((b) =>
        b.name.toLowerCase().includes(bankSearch.toLowerCase())
      )
    : banks;

  async function handleSaveBankDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankDetails }),
      });

      if (res.ok) {
        setSuccess("Bank details saved successfully!");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordData }),
      });

      if (res.ok) {
        setSuccess("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to change password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "PrimetrexBot";
  const telegramDeepLink = `https://t.me/${botUsername}?start=link_${referralCode}`;

  function handleCopyTelegramLink() {
    navigator.clipboard.writeText(telegramDeepLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleUnlinkTelegram() {
    setUnlinking(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlinkTelegram: true }),
      });
      if (res.ok) {
        setTelegramLinked(false);
        setSuccess("Telegram account unlinked. You can now link a different account.");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to unlink Telegram");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setUnlinking(false);
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-3 rounded-xl text-sm font-medium">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Profile info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <User className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold font-heading text-foreground">
            Profile
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium text-foreground">
              {session?.user?.name || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium text-foreground">
              {session?.user?.email || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Referral Code
            </span>
            <span className="text-sm font-mono font-medium text-primary">
              {referralCode || "—"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Telegram Linking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold font-heading text-foreground">
            Telegram Bot
          </h3>
        </div>

        {telegramLinked ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-success/10 px-4 py-3">
              <Check className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium text-success">
                  Telegram linked
                </p>
                <p className="text-xs text-success/70">
                  You will receive notifications about commissions, withdrawals,
                  and subscriptions via Telegram.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
              <Unlink className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Want to link a different account?</p>
                <p className="text-xs text-muted-foreground">Unlinking will remove the connection. You can re-link any Telegram account afterwards.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkTelegram}
                isLoading={unlinking}
                className="shrink-0 text-danger border-danger/30 hover:bg-danger/10"
              >
                {!unlinking && <Unlink className="h-4 w-4" />}
                Unlink
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Link your Telegram account to receive notifications and manage
              your subscription via Telegram.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl bg-muted px-4 py-3 font-mono text-xs text-foreground truncate">
                {telegramDeepLink}
              </div>
              <Button
                variant={linkCopied ? "secondary" : "outline"}
                size="sm"
                onClick={handleCopyTelegramLink}
              >
                {linkCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <a
              href={telegramDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              <LinkIcon className="h-4 w-4" />
              Link Telegram Account
            </a>
            <p className="text-xs text-muted-foreground">
              Tap the link above or open Telegram and search{" "}
              <span className="font-medium">@{botUsername}</span>, then tap Start.
            </p>
          </div>
        )}
      </motion.div>

      {/* Bank details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold font-heading text-foreground">
            Bank Details
          </h3>
        </div>
        <form onSubmit={handleSaveBankDetails} className="space-y-4">
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
                    autoComplete="off"
                    onChange={(e) => setBankSearch(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {filteredBanks.length > 0 ? (
                    filteredBanks.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => {
                          setBankDetails({
                            ...bankDetails,
                            bankCode: bank.code,
                            bankName: bank.name,
                            accountName: "",
                          });
                          setBankSearch("");
                          setResolveError("");
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${
                          bankDetails.bankCode === bank.code
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
                {bankDetails.bankName && (
                  <p className="text-xs text-primary mt-1.5">
                    Selected: {bankDetails.bankName}
                  </p>
                )}
              </>
            )}
          </div>

          <Input
            label="Account Number"
            placeholder="10-digit account number"
            maxLength={10}
            value={bankDetails.accountNumber}
            autoComplete="off"
            inputMode="numeric"
            onChange={(e) => {
              setBankDetails({
                ...bankDetails,
                accountNumber: e.target.value.replace(/\D/g, ""),
                accountName: "",
              });
              setResolveError("");
            }}
            required
          />
          <div>
            <Input
              label="Account Name"
              placeholder={resolving ? "Resolving..." : "Name on account"}
              value={bankDetails.accountName}
              autoComplete="off"
              onChange={(e) =>
                setBankDetails({
                  ...bankDetails,
                  accountName: e.target.value,
                })
              }
              required
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
          <Button type="submit" isLoading={saving}>
            Save Bank Details
          </Button>
        </form>
      </motion.div>

      {/* Change password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold font-heading text-foreground">
            Change Password
          </h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                currentPassword: e.target.value,
              })
            }
            required
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 characters"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                newPassword: e.target.value,
              })
            }
            required
            minLength={8}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Repeat new password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                confirmPassword: e.target.value,
              })
            }
            required
            minLength={8}
          />
          <Button type="submit" isLoading={saving}>
            Change Password
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
