"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, ExternalLink, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface PlanInfo {
  name: string;
  channelName: string;
  price: number;
  renewalPrice: number;
  durationDays: number;
}

interface PageData {
  telegramLinked: boolean;
  plan: PlanInfo;
  isRenewal: boolean;
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function BotSubscribePage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/bot-subscribe")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/bot-subscribe", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to initialize payment");
        return;
      }
      window.location.href = json.paymentUrl;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-32 text-muted-foreground">
        Failed to load subscription info. Please refresh.
      </div>
    );
  }

  if (!data.telegramLinked) {
    return (
      <div className="max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-warning mx-auto" />
          <h2 className="text-xl font-bold font-heading text-foreground">
            Telegram Not Linked
          </h2>
          <p className="text-sm text-muted-foreground">
            You need to link your Telegram account before subscribing to the
            Primetrex channel.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center justify-center gap-2 gradient-primary text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-base"
          >
            Link Telegram in Settings
          </Link>
        </div>
      </div>
    );
  }

  if (data.isRenewal) {
    return (
      <div className="max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <MessageCircle className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-xl font-bold font-heading text-foreground">
            Already Subscribed
          </h2>
          <p className="text-sm text-muted-foreground">
            You have an active subscription. To renew, please use the Telegram
            bot directly.
          </p>
          <a
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "PrimetrexBot"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-medium px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-colors text-base"
          >
            <ExternalLink className="h-4 w-4" />
            Open Telegram Bot
          </a>
        </div>
      </div>
    );
  }

  const plan = data.plan;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Subscribe to {plan.channelName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete your first subscription payment to gain access.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 text-danger px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-primary shrink-0" />
          <h3 className="text-lg font-semibold font-heading text-foreground">
            {plan.name}
          </h3>
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Channel</span>
            <span className="text-sm font-medium text-foreground">
              {plan.channelName}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">First payment</span>
            <span className="text-lg font-bold text-foreground font-heading">
              {formatNaira(plan.price)}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Renewal price</span>
            <span className="text-sm font-medium text-foreground">
              {formatNaira(plan.renewalPrice)}/month
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="text-sm font-medium text-foreground">
              {plan.durationDays} days
            </span>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <Button className="w-full" onClick={handlePay} isLoading={paying}>
            {!paying && <ExternalLink className="h-4 w-4" />}
            Pay {formatNaira(plan.price)} with Flutterwave
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            After payment, your invite link will be sent to you on Telegram automatically.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
