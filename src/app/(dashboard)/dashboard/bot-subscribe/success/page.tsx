"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "motion/react";
import { CheckCircle2, MessageCircle, ExternalLink, XCircle } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "PrimetrexBot";

  const isSuccess = status === "successful" || status === "completed";

  if (!isSuccess) {
    return (
      <div className="max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8 text-center space-y-4"
        >
          <XCircle className="h-14 w-14 text-danger mx-auto" />
          <h2 className="text-xl font-bold font-heading text-foreground">
            Payment Not Completed
          </h2>
          <p className="text-sm text-muted-foreground">
            Your payment was not successful. Please try again or contact support if the issue persists.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard/bot-subscribe"
              className="inline-flex items-center justify-center gap-2 gradient-primary text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-base"
            >
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-medium px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-colors text-base"
            >
              Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-8 text-center space-y-4"
      >
        <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
        <h2 className="text-xl font-bold font-heading text-foreground">
          Payment Successful!
        </h2>
        <p className="text-sm text-muted-foreground">
          Your subscription is being activated. Your Telegram invite link will be
          sent to you on Telegram within a few moments.
        </p>
        <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 flex items-start gap-3 text-left">
          <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Open your Telegram app and check your messages from{" "}
            <span className="font-medium">@{botUsername}</span> — your channel
            invite link will be there.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 gradient-primary text-white font-medium px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-base"
          >
            <ExternalLink className="h-4 w-4" />
            Open Telegram Bot
          </a>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-medium px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-colors text-base"
          >
            Back to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function BotSubscribeSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
