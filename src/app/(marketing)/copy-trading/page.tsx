"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, CheckCircle, ArrowRight, Users, BarChart2, ShieldCheck } from "lucide-react";

const PRICE = 50_000;

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

const features = [
  {
    icon: TrendingUp,
    title: "Expert-Led Copy Trading",
    description: "Follow proven traders and mirror their trades automatically in real time.",
  },
  {
    icon: BarChart2,
    title: "Transparent Performance",
    description: "View verified track records and historical returns before you follow.",
  },
  {
    icon: Users,
    title: "Dedicated Support",
    description: "Get direct access to the Primetrex support team via Telegram for guidance.",
  },
  {
    icon: ShieldCheck,
    title: "One-Time Access Fee",
    description: "Pay once and get lifetime access to the copy trading platform — no recurring charges.",
  },
];

function CopyTradingPageContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (referralCode) {
      sessionStorage.setItem("copy_trading_ref", referralCode);
    }
  }, [referralCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const storedRef = sessionStorage.getItem("copy_trading_ref") || referralCode;
      const res = await fetch("/api/payments/copy-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          referralCode: storedRef || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("Failed to connect. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 gradient-hero" />
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-secondary/20 blur-[80px]"
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-secondary">
              Copy Trading Access
            </span>
            <h1 className="mt-4 text-4xl font-bold font-heading text-white md:text-5xl lg:text-6xl">
              Trade Smarter with{" "}
              <span className="text-secondary">Expert Guidance</span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed">
              Get one-time lifetime access to the Primetrex copy trading platform. Mirror
              verified traders, grow your portfolio, and get dedicated support from our team.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                <span className="text-sm text-white/80">One-time payment</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
                <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                <span className="text-sm text-white/80">Lifetime access</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold font-heading text-foreground">
                  What You Get
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Everything you need to start copy trading with confidence.
                </p>
              </div>

              <div className="space-y-6">
                {features.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
                <p className="text-sm text-muted-foreground">
                  After payment, you&apos;ll receive a confirmation email with instructions.
                  Contact{" "}
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
            </motion.div>

            {/* Payment form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="relative overflow-hidden gradient-primary px-6 py-6">
                  <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-[20px]" />
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">
                    Copy Trading Access
                  </p>
                  <p className="text-4xl font-bold font-heading text-white">
                    {formatNaira(PRICE)}
                  </p>
                  <p className="text-sm text-white/60 mt-1">One-time · Lifetime access</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  {referralCode && (
                    <div className="rounded-xl bg-secondary/10 border border-secondary/20 px-4 py-2.5 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Referred by <span className="font-semibold text-foreground">{referralCode}</span>
                      </p>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-danger bg-danger/10 px-4 py-2.5 rounded-xl">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    Pay {formatNaira(PRICE)}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Secured by Korapay. Your payment is encrypted and safe.
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CopyTradingPage() {
  return (
    <Suspense>
      <CopyTradingPageContent />
    </Suspense>
  );
}
