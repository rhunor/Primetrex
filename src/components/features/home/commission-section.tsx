"use client";

import { motion } from "motion/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Layers, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const earningExamples = [
  {
    label: "You refer Mary (she joins as affiliate)",
    payment: formatCurrency(15_000),
    you: formatCurrency(7_500),
    type: "Affiliate Join (50%)",
  },
  {
    label: "Mary pays her subscription",
    payment: formatCurrency(50_000),
    you: formatCurrency(20_000),
    type: "Tier 1 (40%)",
  },
  {
    label: "Mary refers David (his subscription)",
    payment: formatCurrency(50_000),
    you: formatCurrency(5_000),
    type: "Tier 2 (10%)",
  },
];

function EarningsCalculator() {
  const [referrals, setReferrals] = useState(5);
  const subPrice = siteConfig.subscription.price;
  const tier1 = referrals * subPrice * (siteConfig.commission.subscriptionRate / 100);
  const tier2 = Math.floor(referrals * 0.5) * subPrice * (siteConfig.commission.tier2Rate / 100);
  const total = tier1 + tier2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <h3 className="text-lg font-bold font-heading text-foreground mb-1">
        Earnings Calculator
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Drag to estimate your monthly income
      </p>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Direct referrals</span>
          <span className="text-sm font-bold text-foreground font-heading">
            {referrals} people
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={referrals}
          onChange={(e) => setReferrals(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8808CC ${((referrals - 1) / 49) * 100}%, #e5e1eb ${((referrals - 1) / 49) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
          <span>1</span>
          <span>25</span>
          <span>50</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">
              Tier 1 ({referrals} referrals × ₦{(subPrice / 1000).toFixed(0)}K × 40%)
            </span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(tier1)}
          </span>
        </div>
        <div className="flex items-center justify-between py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-secondary-dark" />
            <span className="text-sm text-muted-foreground">
              Tier 2 (~{Math.floor(referrals * 0.5)} sub-referrals × 10%)
            </span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(tier2)}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="rounded-xl bg-primary/5 border border-primary/15 px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Estimated monthly income
        </span>
        <span className="text-2xl font-bold font-heading gradient-text">
          {formatCurrency(total)}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 text-center">
        * Based on ₦50,000 subscription price. Actual earnings depend on your referrals.
      </p>
    </motion.div>
  );
}

export function CommissionSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/50">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Commission Structure
          </span>
          <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl lg:text-5xl">
            Earn Up to{" "}
            <span className="gradient-text">40% Commission</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Simple, generous, and recurring. Earn from your referrals and their
            referrals — every single month.
          </p>
        </motion.div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {/* Signup fee */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="rounded-2xl border border-border bg-card p-8 text-center transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
              <CreditCard className="h-7 w-7" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              One-Time Signup Fee
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading gradient-text mt-3">
              {formatCurrency(siteConfig.signupFee)}
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              Pay once, earn forever. No recurring fees for affiliates.
            </p>
          </motion.div>

          {/* Tier 1 — featured */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border-2 border-primary bg-card p-8 text-center shadow-lg shadow-primary/10 relative transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full gradient-primary px-4 py-1 text-xs font-bold text-white shadow">
                Direct Referrals
              </span>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              Tier 1 Commission
            </p>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading gradient-text mt-3">
              40%
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              On every subscription payment from people you directly refer.
            </p>
          </motion.div>

          {/* Tier 2 */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-8 text-center transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/20 text-secondary-dark mx-auto mb-4">
              <Layers className="h-7 w-7" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
              Tier 2 Commission
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-secondary-dark mt-3">
              10%
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              On every payment from your referrals&apos; referrals.
            </p>
          </motion.div>
        </div>

        {/* Bottom: Examples + Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Earning examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-bold font-heading text-foreground mb-5">
              Real Earning Example
            </h3>
            <div className="space-y-3">
              {earningExamples.map((ex, index) => (
                <motion.div
                  key={ex.label}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">{ex.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ex.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">pays {ex.payment}</p>
                    <p className="font-bold text-secondary-dark">{ex.you}/mo</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-7">
              <Link href="/register">
                <Button size="lg">
                  Start Earning Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Calculator */}
          <EarningsCalculator />
        </div>
      </div>
    </section>
  );
}
