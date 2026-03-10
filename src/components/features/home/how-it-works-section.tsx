"use client";

import { motion } from "motion/react";
import { UserPlus, Share2, CreditCard, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Pay Once & Sign Up",
    description:
      "Pay a one-time ₦10,000 signup fee to unlock your affiliate account and affiliate link.",
  },
  {
    icon: Share2,
    step: "02",
    title: "Share Your Link",
    description:
      "Get your unique affiliate link and share it with friends, family, and your entire network.",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Referrals Subscribe",
    description:
      "When someone clicks your link and subscribes to Primetrex copy trading, you earn instantly.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Earn Every Month",
    description:
      "Receive recurring commissions every month your referrals stay subscribed. Passive income on autopilot.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden bg-muted/40">
      {/* Top/bottom accent lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-linear-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-linear-to-r from-transparent via-primary/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Simple Process
          </span>
          <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl lg:text-5xl">
            Start Earning in{" "}
            <span className="gradient-text">4 Simple Steps</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Four simple process to become an affiliate and earn passive income monthly from Primetrex affiliate system.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl border border-border bg-card p-6 overflow-hidden transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
            >
              {/* Watermark step number */}
              <span className="absolute -right-1 -top-3 text-6xl sm:text-7xl lg:text-8xl font-bold font-heading text-foreground/[0.035] select-none pointer-events-none leading-none">
                {step.step}
              </span>

              {/* Hover accent */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icon */}
              <div
                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/20 mb-5 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
              >
                <step.icon className="h-7 w-7" />
              </div>

              {/* Step label */}
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary/50 mb-1.5">
                Step {step.step}
              </p>

              {/* Title */}
              <h3 className="text-base font-bold font-heading text-foreground">
                {step.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
