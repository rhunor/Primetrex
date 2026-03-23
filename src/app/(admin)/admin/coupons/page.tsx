"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    code: "",
    discountType: "fixed" as "fixed" | "percentage",
    discountValue: "",
    expiresAt: "",
  });

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
      setForm({ code: "", discountType: "fixed", discountValue: "", expiresAt: "" });
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Coupon Codes</h1>
          <p className="text-muted-foreground mt-1">Generate and manage discount codes for subscribers.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Coupon
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Create Coupon</h2>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Code</label>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase"
                placeholder="e.g. PROMO50"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
            </div>

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

            <div className="space-y-1 col-span-2">
              <label className="text-sm font-medium text-foreground">Expires At (blank = never)</label>
              <input
                type="date"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={creating} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Coupon
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(null); }}>
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
            <div key={c._id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{c.code}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    c.isActive ? "bg-secondary/20 text-secondary-dark" : "bg-muted text-muted-foreground"
                  )}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {c.discountType === "fixed"
                    ? `${formatNaira(c.discountValue)} off`
                    : `${c.discountValue}% off${c.discountValue === 100 ? " (free renewal)" : ""}`}
                  {c.timesUsed > 0 ? " · Used" : " · Not used yet"}
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
