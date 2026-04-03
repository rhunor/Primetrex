"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { CheckCircle, MessageCircle, ArrowRight } from "lucide-react";

export default function CopyTradingSuccessPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    sessionStorage.removeItem("copy_trading_ref");
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-24">
      <div className="absolute inset-0 gradient-hero" />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-secondary/20 blur-[100px]"
      />

      <div className="relative mx-auto max-w-lg px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={visible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex justify-center mb-6"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20">
            <CheckCircle className="h-10 w-10 text-secondary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h1 className="text-3xl font-bold font-heading text-white md:text-4xl">
            Payment Successful!
          </h1>
          <p className="mt-4 text-white/60 leading-relaxed">
            You now have access to the Primetrex Copy Trading platform.
            Check your email for your receipt and onboarding instructions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-left space-y-3"
        >
          <p className="text-sm font-semibold text-white">Next steps:</p>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/20 text-secondary text-xs font-bold shrink-0 mt-0.5">1</span>
            <p className="text-sm text-white/70">Check your inbox for your payment receipt and access details.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/20 text-secondary text-xs font-bold shrink-0 mt-0.5">2</span>
            <p className="text-sm text-white/70">
              Message{" "}
              <a
                href="https://t.me/Primetrexsupport"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-secondary hover:underline"
              >
                @Primetrexsupport
              </a>{" "}
              on Telegram to complete your onboarding.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/20 text-secondary text-xs font-bold shrink-0 mt-0.5">3</span>
            <p className="text-sm text-white/70">Our team will set up your copy trading access within 24 hours.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <a
            href="https://t.me/Primetrexsupport"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support on Telegram
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
