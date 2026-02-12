"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Zap,
  Star,
  CheckCircle,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />

      {/* Animated grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating orbs */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[100px]"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-secondary-dark/20 blur-[120px]"
      />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-secondary backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                Start earning today
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-4xl font-bold leading-tight text-white font-heading sm:text-5xl md:text-6xl lg:text-7xl"
            >
              If Wealth Is Not A Curse,{" "}
              <span className="text-secondary">Build It Here</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-white/60 leading-relaxed max-w-xl md:text-xl"
            >
              A structured platform for intelligent capital growth. Refer others
              to Primetrex copy trading and earn recurring commissions every
              month through our 2-tier system.
            </motion.p>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              {[
                "No trading experience needed",
                "Withdraw anytime",
                "Verified platform",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-xs text-white/50">{item}</span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Get Your Referral Link
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  How It Works
                </Button>
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 grid grid-cols-3 gap-8 max-w-md"
            >
              {[
                { icon: TrendingUp, value: "50%", label: "Tier 1 Commission" },
                { icon: Users, value: "10%", label: "Tier 2 Bonus" },
                { icon: Zap, value: "₦15K", label: "One-Time Fee" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="text-center sm:text-left"
                >
                  <stat.icon className="h-5 w-5 text-secondary mb-2 mx-auto sm:mx-0" />
                  <div className="text-2xl font-bold text-white font-heading">
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: Visual content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Main dashboard mockup image */}
            <div className="relative">
              {/* Glow behind image */}
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-3xl" />

              {/* Dashboard preview */}
              <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 shadow-2xl">
                <div className="rounded-xl overflow-hidden bg-dark-surface">
                  <Image
                    src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&h=800&fit=crop&q=90"
                    alt="Analytics dashboard showing trading performance"
                    width={1200}
                    height={800}
                    className="w-full h-auto object-cover opacity-90"
                    priority
                  />
                </div>
              </div>

              {/* Floating stat card 1 */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -left-8 top-8 rounded-xl border border-white/10 bg-dark-surface/90 backdrop-blur-md p-3 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Earnings Today</p>
                    <p className="text-sm font-bold text-white font-heading">
                      +₦45,000
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Floating stat card 2 */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -right-4 bottom-12 rounded-xl border border-white/10 bg-dark-surface/90 backdrop-blur-md p-3 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <Users className="h-5 w-5 text-primary-light" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">New Referrals</p>
                    <p className="text-sm font-bold text-white font-heading">
                      +12 this week
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Star rating floating card */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -right-6 top-4 rounded-lg border border-white/10 bg-dark-surface/90 backdrop-blur-md px-3 py-2 shadow-xl"
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="text-xs text-white/60 ml-1">4.9</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
