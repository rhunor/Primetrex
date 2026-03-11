"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionStatus {
  telegramLinked: boolean;
  botLink: string;
  subscription: {
    status: "active" | "expired" | "cancelled";
    expiryDate: string;
    daysLeft: number;
  } | null;
  plan: {
    price: number;
    renewalPrice: number;
  } | null;
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchStatus = useCallback(() => {
    setLoading(true);
    return fetch("/api/bot-subscription/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // After Flutterwave redirect: confirm payment then re-fetch status
  useEffect(() => {
    const botPaid = searchParams.get("bot_paid");
    const txRef = searchParams.get("tx_ref");

    if (botPaid === "success") {
      setShowSuccess(true);
      router.replace("/dashboard/subscription");

      if (txRef) {
        setConfirming(true);
        fetch("/api/bot-subscription/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txRef }),
        })
          .then(() => fetchStatus())
          .catch(() => {})
          .finally(() => setConfirming(false));
      }
    }
  }, [searchParams, router, fetchStatus]);

  async function handlePay() {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/bot-subscription/initialize", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.paymentUrl) {
        window.location.href = json.paymentUrl;
      } else {
        setError(json.error || "Failed to initialize payment. Please try again.");
        setPaying(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  if (loading || confirming) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        {confirming && (
          <p className="text-sm text-muted-foreground">Activating your subscription...</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Subscription
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your Primetrex copy trading subscription.
        </p>
      </div>

      {/* Explanation box */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h2 className="font-semibold text-foreground">What is this subscription?</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This subscription gives you access to the <span className="font-medium text-foreground">Primetrex Copy Trading Platform</span> — a premium service where professional traders place trades on your behalf automatically.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">This is completely optional.</span> As a Primetrex affiliate, you can earn commissions by referring others without subscribing yourself. If you&apos;re interested in using the copy trading service as a product, you can subscribe here. If you just want to earn as an affiliate, you can skip this page entirely.
        </p>
      </div>

      {/* Success banner */}
      {showSuccess && (
        <div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/10 p-4">
          <CheckCircle className="h-5 w-5 text-secondary-dark mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-secondary-dark">Payment received!</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Check your Telegram bot — your channel invite link has been sent.
              If you don&apos;t see it, type <code className="text-xs bg-muted px-1 py-0.5 rounded">/status</code> in the bot.
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4">
          <AlertCircle className="h-5 w-5 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* State A: Telegram not linked */}
      {data && !data.telegramLinked && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Bot Subscription</h2>
              <p className="text-sm text-muted-foreground">Telegram account not linked</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            To subscribe via this dashboard and receive your channel invite link automatically,
            you first need to link your Telegram account.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
              <span className="font-bold text-primary text-sm mt-0.5">1</span>
              <p className="text-sm text-foreground">
                Click the button below to open the Primetrex bot in Telegram.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
              <span className="font-bold text-primary text-sm mt-0.5">2</span>
              <p className="text-sm text-foreground">
                The bot will confirm your account is linked.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
              <span className="font-bold text-primary text-sm mt-0.5">3</span>
              <p className="text-sm text-foreground">
                Return here to subscribe and pay.
              </p>
            </div>
          </div>

          <a href={data.botLink} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2">
              Open Telegram Bot
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={fetchStatus}
          >
            <RefreshCw className="h-4 w-4" />
            I&apos;ve linked my account — refresh
          </Button>
        </div>
      )}

      {/* State B & C: Telegram linked */}
      {data && data.telegramLinked && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl">📱</span>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Bot Subscription</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-dark inline-block" />
                  Telegram connected
                </p>
              </div>
            </div>

            {/* Status badge */}
            {data.subscription && (
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold",
                  data.subscription.status === "active"
                    ? "bg-secondary/20 text-secondary-dark"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {data.subscription.status === "active" ? "🟢 Active" : "🔴 Expired"}
              </span>
            )}
          </div>

          {/* Active subscription details */}
          {data.subscription && data.subscription.status === "active" && (
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium text-foreground">
                  {formatDate(data.subscription.expiryDate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days remaining</span>
                <span
                  className={cn(
                    "font-semibold",
                    data.subscription.daysLeft <= 7
                      ? "text-amber-500"
                      : "text-secondary-dark"
                  )}
                >
                  {data.subscription.daysLeft} days
                </span>
              </div>
            </div>
          )}

          {/* No subscription or expired */}
          {(!data.subscription || data.subscription.status !== "active") && (
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">No active subscription</p>
              <p className="text-xs text-muted-foreground mt-1">
                Subscribe to get access to Primetrex copy trading signals.
              </p>
            </div>
          )}

          {/* Price and pay button */}
          {data.plan && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {data.subscription?.status === "active" ? "Renewal price" : "Subscription price"}
                </span>
                <span className="text-xl font-bold text-foreground">
                  {data.subscription?.status === "active"
                    ? formatNaira(data.plan.renewalPrice)
                    : formatNaira(data.plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </span>
              </div>

              <Button
                className="w-full gradient-primary text-white font-semibold py-3"
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting to payment...
                  </>
                ) : data.subscription?.status === "active" ? (
                  `Renew — ${formatNaira(data.plan.renewalPrice)}`
                ) : (
                  `Subscribe — ${formatNaira(data.plan.price)}`
                )}
              </Button>
            </div>
          )}

          {/* How it works after payment */}
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              After payment
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-secondary-dark mt-0.5 shrink-0" />
                Your subscription activates automatically
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-secondary-dark mt-0.5 shrink-0" />
                You&apos;ll receive your channel invite link in the Telegram bot
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-secondary-dark mt-0.5 shrink-0" />
                Your referrer is credited automatically
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
