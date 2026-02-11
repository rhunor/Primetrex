"use client";

import { motion } from "motion/react";
import { UserPlus, Share2, CreditCard, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up Free",
    description:
      "Create your free account in under a minute. No fees, no commitments.",
  },
  {
    icon: Share2,
    step: "02",
    title: "Share Your Link",
    description:
      "Get your unique referral link and share it with friends, family, and your network.",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Referrals Subscribe",
    description:
      "When someone clicks your link and subscribes to Primetrex copy trading, you earn.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Earn Every Month",
    description:
      "Receive recurring commissions every month your referrals stay subscribed. Passive income.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl lg:text-5xl">
            Start Earning in{" "}
            <span className="gradient-text">4 Simple Steps</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Getting started is easy. No trading knowledge required — just share
            and earn.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-24 left-0 right-0 hidden lg:block">
            <div className="mx-auto max-w-4xl h-0.5 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="text-center relative"
              >
                {/* Step number */}
                <div className="relative inline-flex">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-white shadow-lg shadow-primary/25 mx-auto"
                  >
                    <step.icon className="h-8 w-8" />
                  </motion.div>
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary-dark">
                    {step.step}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-semibold font-heading text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
