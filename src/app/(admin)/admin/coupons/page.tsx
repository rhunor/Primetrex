"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ToggleLeft, ToggleRight, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function generateCouponCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < 3; i++) code += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}

interface Coupon {
  _id: string;
  code: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  maxUses: number | null;
  timesUsed: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: generateCouponCode(),
    discountType: "fixed" as "fixed" | "percentage",
    discountValue: "",
    expiresAt: "",
  });

  const resetForm = useCallback(() => {
    setForm({ code: generateCouponCode(), discountType: "fixed", discountValue: "", expiresAt: "" });
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    if (res.ok) {
      const data = await res.json();
      setCoupons(data.coupons);
    }
    setLoading(false);
  }

  useEffect(() => { fetchCoupons(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        expiresAt: form.expiresAt || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setShowForm(false);
      resetForm();
      fetchCoupons();
    }
    setCreating(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchCoupons();
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    fetchCoupons();
  }

  return (
    <div className="space-y-6 w-full max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">Coupon Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and manage discount codes for subscribers.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4" />
          New Coupon
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Create Coupon</h2>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Generated code */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Generated Code</label>
              <div className="flex gap-2 items-center">
                <span className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-mono font-bold tracking-widest text-foreground">
                  {form.code}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm({ ...form, code: generateCouponCode() })}
                  title="Generate new code"
                  className="shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Discount type */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Discount Type</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value as "fixed" | "percentage" })}
              >
                <option value="fixed">Fixed Amount (₦)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>

            {/* Discount value */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                {form.discountType === "fixed" ? "Amount (₦)" : "Percentage (%)"}
              </label>
              <input
                type="number"
                min={1}
                max={form.discountType === "percentage" ? 100 : undefined}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder={form.discountType === "fixed" ? "5000" : "100"}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                required
              />
              {form.discountType === "percentage" && Number(form.discountValue) === 100 && (
                <p className="text-xs text-secondary-dark">Free renewal — no payment required</p>
              )}
            </div>

            {/* Expiry */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Expires At <span className="text-muted-foreground font-normal">(leave blank = never expires)</span></label>
              <input
                type="date"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={creating} className="gap-2 w-full sm:w-auto">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Coupon
            </Button>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setShowForm(false); setError(null); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Coupon list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">No coupons yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c._id} className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-foreground tracking-wider">{c.code}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold shrink-0",
                    c.isActive ? "bg-secondary/20 text-secondary-dark" : "bg-muted text-muted-foreground"
                  )}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                  {c.timesUsed > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground shrink-0">
                      Used
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {c.discountType === "fixed"
                    ? `${formatNaira(c.discountValue)} off`
                    : `${c.discountValue}% off${c.discountValue === 100 ? " · free renewal" : ""}`}
                  {c.expiresAt ? ` · expires ${formatDate(c.expiresAt)}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => toggleActive(c._id, c.isActive)}
                >
                  {c.isActive
                    ? <ToggleRight className="h-4 w-4 text-secondary-dark" />
                    : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  {c.isActive ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger"
                  onClick={() => deleteCoupon(c._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
