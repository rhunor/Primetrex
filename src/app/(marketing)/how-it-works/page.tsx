"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  CreditCard,
  Share2,
  TrendingUp,
  ArrowRight,
  Check,
  Repeat,
  Users,
  Layers,
  MessageSquare,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Sign Up & Pay the Signup Fee",
    description: `Create your account and pay the one-time ${formatCurrency(siteConfig.signupFee)} signup fee. This activates your affiliate dashboard and unique referral link. No recurring fees — pay once, earn forever.`,
    details: [
      "Quick registration form",
      `One-time ${formatCurrency(siteConfig.signupFee)} activation fee`,
      "Instant dashboard access after payment",
    ],
  },
  {
    step: "02",
    icon: Share2,
    title: "Share Your Referral Link",
    description:
      "Copy your unique referral link from the dashboard and share it anywhere — WhatsApp, Twitter, Instagram, Telegram, or in person. Every click is tracked to your account.",
    details: [
      "One-click copy from dashboard",
      "Works on any platform",
      "Track every click in real-time",
    ],
  },
  {
    step: "03",
    icon: CreditCard,
    title: "Your Referrals Subscribe",
    description: `When someone clicks your link and subscribes to Primetrex copy trading (${formatCurrency(siteConfig.subscription.price)}/month), the system automatically credits 50% to your account.`,
    details: [
      "Automatic commission tracking",
      "50% credited instantly",
      "Email notification on every sale",
    ],
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Earn Every Single Month",
    description:
      "As long as your referrals stay subscribed, you earn 50% on every renewal. Plus, earn 10% from people your referrals bring in (Tier 2). True passive income.",
    details: [
      "Recurring monthly commissions",
      "10% Tier 2 from sub-referrals",
      "Withdraw to your bank anytime",
    ],
  },
];

const earningExamples = [
  {
    scenario: "You refer Mary",
    payment: formatCurrency(50_000) + "/month",
    yourEarning: formatCurrency(25_000) + "/month",
    tier: "Tier 1 — 50% direct commission",
    icon: Users,
  },
  {
    scenario: "Mary refers David",
    payment: formatCurrency(50_000) + "/month",
    yourEarning: formatCurrency(5_000) + "/month",
    tier: "Tier 2 — 10% sub-referral bonus",
    icon: Layers,
  },
  {
    scenario: "You refer 10 people",
    payment: formatCurrency(50_000) + " × 10",
    yourEarning: formatCurrency(250_000) + "/month",
    tier: "Tier 1 — 50% on all 10 referrals",
    icon: TrendingUp,
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 gradient-hero" />
        <motion.div
          animate={{ y: [0, -25, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 left-1/4 h-72 w-72 rounded-full bg-secondary-dark/20 blur-[100px]"
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-secondary">
              How It Works
            </span>
            <h1 className="mt-4 text-4xl font-bold font-heading text-white md:text-5xl lg:text-6xl">
              Start Earning in{" "}
              <span className="text-secondary">4 Simple Steps</span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed">
              Pay a one-time {formatCurrency(siteConfig.signupFee)} signup fee,
              share your link, and earn 50% recurring commissions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col md:flex-row gap-8 items-start"
              >
                <div className="shrink-0">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/25">
                      <step.icon className="h-9 w-9" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary-dark">
                      {step.step}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block w-0.5 h-16 bg-gradient-to-b from-primary/30 to-transparent mx-auto mt-4" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold font-heading text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {step.details.map((detail) => (
                      <li
                        key={detail}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-secondary-dark shrink-0" />
                        <span className="text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-24 md:py-32 bg-muted/50">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Commission Structure
            </span>
            <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl">
              Simple &{" "}
              <span className="gradient-text">Generous</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              No confusing tiers. A flat 50% on direct referrals and 10% on
              sub-referrals. Every affiliate earns the same rate.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Tier 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border-2 border-primary bg-card p-8 text-center shadow-lg shadow-primary/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                <Users className="h-7 w-7" />
              </div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                Tier 1 — Direct Referrals
              </p>
              <p className="text-6xl font-bold font-heading gradient-text mt-3">
                50%
              </p>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                You earn 50% of every {formatCurrency(siteConfig.subscription.price)} monthly payment
                from people you directly refer. That&apos;s{" "}
                <strong className="text-foreground">{formatCurrency(25_000)}/month per referral</strong>.
              </p>
            </motion.div>

            {/* Tier 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border-2 border-secondary-dark/30 bg-card p-8 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/20 text-secondary-dark mx-auto mb-4">
                <Layers className="h-7 w-7" />
              </div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                Tier 2 — Sub-Referrals
              </p>
              <p className="text-6xl font-bold font-heading text-secondary-dark mt-3">
                10%
              </p>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                When your referrals bring in their own customers, you earn 10%
                on those payments too. That&apos;s{" "}
                <strong className="text-foreground">{formatCurrency(5_000)}/month per sub-referral</strong>.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Earning Examples */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Earning Examples
            </span>
            <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl">
              See How Your Earnings{" "}
              <span className="gradient-text">Add Up</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {earningExamples.map((example, index) => (
              <motion.div
                key={example.scenario}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <example.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {example.scenario}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {example.tier}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm sm:text-right">
                  <div>
                    <p className="text-muted-foreground">Payment</p>
                    <p className="font-medium text-foreground">
                      {example.payment}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">You Earn</p>
                    <p className="font-bold text-secondary-dark text-lg">
                      {example.yourEarning}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 md:py-32 bg-muted/50">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl font-bold font-heading text-foreground md:text-4xl">
              What&apos;s Included
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, label: "2-tier commission tracking (50% + 10%)" },
              { icon: TrendingUp, label: "Real-time analytics dashboard" },
              { icon: Wallet, label: "Bank withdrawal system (min ₦10,000)" },
              { icon: MessageSquare, label: "Telegram bot for renewals" },
              { icon: Share2, label: "Unique referral links & QR codes" },
              { icon: Repeat, label: "Recurring monthly commissions" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold font-heading text-white md:text-4xl">
              Ready to Start{" "}
              <span className="text-secondary">Earning?</span>
            </h2>
            <p className="mt-6 text-lg text-white/60">
              Pay {formatCurrency(siteConfig.signupFee)} once, get your link,
              and earn 50% commissions every month.
            </p>
            <div className="mt-10">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Get Your Referral Link
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
