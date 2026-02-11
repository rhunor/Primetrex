"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Layers, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const earningExamples = [
  {
    label: "You refer Mary",
    payment: formatCurrency(50_000),
    you: formatCurrency(25_000),
    type: "Tier 1 (50%)",
  },
  {
    label: "Mary refers David",
    payment: formatCurrency(50_000),
    you: formatCurrency(5_000),
    type: "Tier 2 (10%)",
  },
  {
    label: "Both renew next month",
    payment: formatCurrency(100_000),
    you: formatCurrency(30_000),
    type: "Recurring",
  },
];

export function CommissionSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/50">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Commission Structure
          </span>
          <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl lg:text-5xl">
            Earn Up to{" "}
            <span className="gradient-text">50% Commission</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Simple, generous, and recurring. Earn from your referrals and their
            referrals — every single month.
          </p>
        </motion.div>

        {/* Commission cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Signup fee */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            whileHover={{ y: -6 }}
            className="rounded-2xl border-2 border-border bg-card p-8 text-center transition-shadow hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
              <CreditCard className="h-7 w-7" />
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
              One-Time Signup Fee
            </p>
            <p className="text-4xl font-bold font-heading gradient-text mt-2">
              {formatCurrency(siteConfig.signupFee)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Pay once, earn forever. No recurring fees for affiliates.
            </p>
          </motion.div>

          {/* Tier 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="rounded-2xl border-2 border-primary bg-card p-8 text-center shadow-primary/10 shadow-lg transition-shadow hover:shadow-xl relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full gradient-primary px-4 py-1 text-xs font-semibold text-white">
                Direct Referrals
              </span>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
              Tier 1 Commission
            </p>
            <p className="text-5xl font-bold font-heading gradient-text mt-2">
              50%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              On every payment from people you directly refer.
            </p>
          </motion.div>

          {/* Tier 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -6 }}
            className="rounded-2xl border-2 border-border bg-card p-8 text-center transition-shadow hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/20 text-secondary-dark mx-auto mb-4">
              <Layers className="h-7 w-7" />
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
              Tier 2 Commission
            </p>
            <p className="text-4xl font-bold font-heading text-secondary-dark mt-2">
              10%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              On every payment from your referrals&apos; referrals.
            </p>
          </motion.div>
        </div>

        {/* Earning examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-lg font-semibold font-heading text-foreground text-center mb-6">
            Real Earning Example
          </h3>
          <div className="space-y-3">
            {earningExamples.map((ex, index) => (
              <motion.div
                key={ex.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
              >
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {ex.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{ex.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    pays {ex.payment}
                  </p>
                  <p className="font-bold text-secondary-dark">{ex.you}/mo</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/register">
              <Button size="lg">
                Start Earning Now
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
