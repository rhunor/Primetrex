"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowUpRight,
} from "lucide-react";

const tickerItems = [
  
  "Withdrawal processed in <24hrs",
  "Join 1,200+ affiliates",
  
  "40% commission — every month",
  "No trading knowledge needed",
];

const chartData = [30, 48, 38, 65, 50, 72, 58, 84, 70, 100];

const recentComms = [
  { initials: "MA", name: "Mary A.", amount: "+₦20,000", type: "Tier 1 · 2h ago" },
  { initials: "DK", name: "David K.", amount: "+₦5,000", type: "Tier 2 · 5h ago" },
  { initials: "FO", name: "Femi O.", amount: "+₦20,000", type: "Tier 1 · 1d ago" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Orbs */}
      <motion.div
        animate={{ y: [0, -24, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{ opacity: 0.3, willChange: "transform" }}
        className="absolute top-1/4 left-[15%] h-40 w-40 sm:h-56 sm:w-56 md:h-72 md:w-72 rounded-full bg-primary/30 blur-[40px] sm:blur-[55px] md:blur-[70px] pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{ opacity: 0.18, willChange: "transform" }}
        className="absolute bottom-1/4 right-[10%] h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80 rounded-full bg-secondary-dark/25 blur-[50px] sm:blur-[70px] md:blur-[90px] pointer-events-none"
      />

      {/* Ticker bar */}
      <div className="relative border-b border-white/10 overflow-hidden py-2.5 bg-white/[0.02]">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-8 text-xs text-white/40">
              <span className="h-1 w-1 rounded-full bg-secondary flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative mx-auto max-w-7xl px-6 py-8 md:py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Left: Copy */}
          <div className="max-w-xl">
            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="text-[2rem] font-bold leading-tight tracking-tight text-white font-heading sm:text-4xl lg:text-5xl"
            >
              1,200+ Nigerians Are Already Earning.{" "}
              <span className="text-secondary">Why Aren&apos;t You?</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 text-sm text-white/55 leading-relaxed md:text-base"
            >
              Join Primetrex Affiliates and earn{" "}
              <span className="text-white/80 font-medium">40% commission</span>{" "}
              by introducing people to a platform that helps them profit from trading — without becoming traders themselves. Earn reoccurring commission every month from the same customers, plus get{" "}
              <span className="text-white/80 font-medium">10%</span>{" "}
              from people they refer. Build income that grows even when you&apos;re not working.
            </motion.p>

            {/* Checklist */}
            <motion.ul
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-3 space-y-1.5"
            >
              {[
                "No trading experience required",
                "₦5,000–₦20,000 per referral per month",
                "Withdraw directly to your bank account",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span className="text-sm text-white/55">{item}</span>
                </li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38 }}
              className="mt-4 flex flex-col sm:flex-row gap-3"
            >
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/how-it-works" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="mt-2 text-xs text-white/25"
            >
              Powered by Flutterwave · Payments 100% secured
            </motion.p>
          </div>

          {/* Right: Custom animated dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.25 }}
            className="relative hidden lg:block"
          >
            {/* Glow */}
            <div className="absolute -inset-6 bg-primary/10 rounded-3xl blur-3xl pointer-events-none" />

            {/* Dashboard card */}
            <div className="relative rounded-2xl border border-white/[0.12] bg-[#0d0819]/90 backdrop-blur-xl p-5 shadow-[0_0_60px_rgba(136,8,204,0.12)]">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 mb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                <span className="ml-3 text-white/20 text-[10px] font-mono tracking-wide">
                  My Affiliate Dashboard
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse-glow" />
                  Live
                </span>
              </div>

              {/* Earnings summary */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/30 text-xs">Total Commissions Earned</p>
                  <p className="text-white text-3xl font-bold font-heading mt-0.5 tracking-tight">
                    ₦1,345,000
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-secondary/10 border border-secondary/20 px-2.5 py-1.5">
                  <ArrowUpRight className="h-3 w-3 text-secondary flex-shrink-0" />
                  <span className="text-secondary text-[11px] font-semibold whitespace-nowrap">
                    +₦282,000 this month
                  </span>
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-1.5 h-16 mb-4 px-0.5">
                {chartData.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.6 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                    style={{ originY: 1, height: `${h}%` }}
                    className={`flex-1 rounded-t-[3px] ${
                      i === chartData.length - 1
                        ? "bg-secondary shadow-[0_0_8px_rgba(154,255,163,0.5)]"
                        : "bg-white/[0.12]"
                    }`}
                  />
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06] mb-3" />

              {/* Recent commissions */}
              <p className="text-white/25 text-[10px] uppercase tracking-widest font-medium mb-2.5">
                Recent
              </p>
              <div className="space-y-2">
                {recentComms.map((c, i) => (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] text-white/50 font-semibold flex-shrink-0">
                        {c.initials}
                      </div>
                      <div>
                        <p className="text-white/75 text-xs font-medium leading-none">{c.name}</p>
                        <p className="text-white/25 text-[10px] mt-0.5">{c.type}</p>
                      </div>
                    </div>
                    <p className="text-secondary text-xs font-bold">{c.amount}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating: commission notification */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="absolute -left-6 top-1/3 rounded-xl border border-white/[0.12] bg-[#0d0819]/95 backdrop-blur-md p-3 shadow-xl hidden sm:block"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-2.5"
              >
                <div className="h-8 w-8 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] text-white/35">Commission paid</p>
                  <p className="text-xs font-bold text-white">+₦20,000</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating: referrals card */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.35, duration: 0.5 }}
              className="absolute -right-4 bottom-6 rounded-xl border border-white/[0.12] bg-[#0d0819]/95 backdrop-blur-md p-3 shadow-xl hidden sm:block"
            >
              <motion.div
                animate={{ y: [0, 7, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-2.5"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-primary-light" />
                </div>
                <div>
                  <p className="text-[10px] text-white/35">Active referrals</p>
                  <p className="text-xs font-bold text-white">24 people</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
