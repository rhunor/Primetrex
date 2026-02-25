"use client";

import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { CreditCard, Shield } from "lucide-react";

export default function PendingPaymentPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isPayingRef = useRef(false);

  async function handlePayment() {
    if (isPayingRef.current) return;
    isPayingRef.current = true;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          name: session?.user?.name || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment initialization failed");
        isPayingRef.current = false;
        setIsLoading(false);
        return;
      }

      window.location.href = data.paymentUrl;
    } catch {
      setError("Failed to initialize payment. Please try again.");
      isPayingRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-white mb-4">
            <CreditCard className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Complete Your Payment
          </h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-sm mx-auto">
            Your account is registered but the one-time signup fee hasn&apos;t been paid yet. Pay now to unlock your affiliate dashboard.
          </p>
        </div>

        {/* Payment card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {/* Account info */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Account</span>
              <span className="font-medium truncate ml-4 text-foreground">
                {session?.user?.email ?? "—"}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-muted-foreground">Item</span>
              <span className="font-medium text-foreground">Affiliate Signup Fee</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold font-heading gradient-text">
                {formatCurrency(siteConfig.signupFee)}
              </span>
            </div>
          </div>

          {/* What you get */}
          <ul className="space-y-2">
            {[
              "50% commission on direct referrals",
              "10% commission on sub-referrals (Tier 2)",
              "Personal dashboard with live earnings",
              "Direct bank withdrawals",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            Secured by Flutterwave. Your payment information is encrypted.
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button
            onClick={handlePayment}
            className="w-full"
            size="lg"
            isLoading={isLoading}
            disabled={!session?.user?.email}
          >
            Pay {formatCurrency(siteConfig.signupFee)} with Flutterwave
            <CreditCard className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          One-time fee · No recurring charges for affiliates
        </p>
      </div>
    </div>
  );
}
