"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, TrendingUp, Wallet } from "lucide-react";

const stats = [
  { icon: Users, value: "1,200+", label: "Active Affiliates" },
  { icon: TrendingUp, value: "50%", label: "Tier 1 Commission" },
  { icon: Wallet, value: "₦10K", label: "Min Withdrawal" },
];

export function CTASection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 20.0l2.83-2.83 1.41 1.41L1.41 21.41 0 20zm0-18.59L2.83.17 4.24 1.58 1.41 4.41H0V1.41zM18.59 40l2.83-2.83 1.41 1.41L20 41.41 18.59 40zm20 0l2.83-2.83 1.41 1.41L40 41.41V40h-1.41zM0 0h1.41l2.83 2.83L2.83 4.24 0 1.41V0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating orb */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] sm:h-[380px] sm:w-[380px] lg:h-[500px] lg:w-[500px] rounded-full bg-primary/25 blur-[80px] sm:blur-[120px] lg:blur-[150px] pointer-events-none"
      />

      <div className="relative mx-auto max-w-5xl px-6">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-3 gap-2 sm:gap-4 mb-14 max-w-lg mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="flex justify-center mb-1.5">
                <stat.icon className="h-4 w-4 text-secondary/70" />
              </div>
              <p className="text-xl font-bold font-heading text-white">{stat.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold font-heading text-white md:text-4xl lg:text-5xl leading-tight">
            Ready to Start{" "}
            <span className="text-secondary">Building Wealth?</span>
          </h2>
          <p className="mt-5 text-lg text-white/55 leading-relaxed max-w-xl mx-auto">
            Join today for a one-time ₦15,000 signup fee. Get your referral link,
            start sharing, and earn recurring commissions every month.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full">
                Join for ₦15,000
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                Talk to Us
              </Button>
            </Link>
          </div>

          {/* Reassurance */}
          <p className="mt-6 text-xs text-white/25">
            One-time fee · No recurring charges · Withdraw anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
