"use client";

import { motion } from "motion/react";
import { ShieldCheck, Headphones, BarChart3, Lock, Zap, Globe, Star } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Bank-Level Security",
    description:
      "256-bit SSL encryption, secure sessions, and PCI-compliant payment processing on every transaction.",
    tag: "Your money is safe",
    iconColor: "bg-primary/10 text-primary",
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description:
      "Track every click, referral, and commission in real-time. Full transparency with live data.",
    tag: "Full transparency",
    iconColor: "bg-secondary/20 text-secondary-dark",
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    description:
      "Know the moment a referral joins and pays. Your commission is logged and ready to withdraw immediately.",
    tag: "Always in the loop",
    iconColor: "bg-primary/10 text-primary",
  },
  {
    icon: Globe,
    title: "Withdraw Anywhere",
    description:
      "Transfer your earnings directly to any Nigerian bank account. Fast processing, no hidden fees.",
    tag: "Direct bank transfers",
    iconColor: "bg-secondary/20 text-secondary-dark",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description:
      "Need help? Our support team is available via email and ready to assist you anytime.",
    tag: "We've got your back",
    iconColor: "bg-primary/10 text-primary",
  },
  {
    icon: Lock,
    title: "Verified Platform",
    description:
      "Powered by Korapay — secure and trusted payment processing. Every transaction is verified.",
    tag: "Trusted payments",
    iconColor: "bg-secondary/20 text-secondary-dark",
  },
];

const otherAffiliates = [
  { initials: "TO", name: "Tunde O.", location: "Abuja" },
  { initials: "AF", name: "Amaka F.", location: "Enugu" },
  { initials: "SK", name: "Seun K.", location: "Ibadan" },
  { initials: "BN", name: "Bola N.", location: "Port Harcourt" },
];

export function TrustSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Why Primetrex
          </span>
          <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl lg:text-5xl">
            A Platform You Can{" "}
            <span className="gradient-text">Actually Trust</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Built for affiliates who take their income seriously.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.07 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/15"
            >
              {/* Icon */}
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconColor} mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Title */}
              <h3 className="text-base font-bold font-heading text-foreground">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Tag */}
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                {feature.tag}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonial + social proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Photo testimonial */}
            <div className="relative p-8 bg-primary/[0.03] border-b md:border-b-0 md:border-r border-border flex items-center gap-5">
              {/* Subtle quote mark */}
              <span className="absolute top-4 right-6 text-7xl font-heading text-primary/[0.07] leading-none select-none pointer-events-none">"</span>

              {/* Initials avatar — brand styled */}
              <div className="shrink-0 h-18 w-18 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold font-heading ring-2 ring-primary/20 select-none">
                AO
              </div>
              <div>
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-secondary text-secondary" />
                  ))}
                </div>
                <blockquote className="text-sm font-medium text-foreground leading-relaxed">
                  "I sold to 12 people my first month and earned over ₦300,000 recurring. This is the most reliable income stream I've found."
                </blockquote>
                <p className="mt-2 text-xs text-muted-foreground">
                  Adebayo O. — Lagos, Nigeria
                </p>

                {/* Other affiliates row */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex -space-x-2">
                    {otherAffiliates.map((a) => (
                      <div
                        key={a.initials}
                        title={`${a.name}, ${a.location}`}
                        className="h-7 w-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[9px] font-bold text-primary"
                      >
                        {a.initials}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +1,200 affiliates earning across Nigeria
                  </p>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 divide-x divide-y divide-border">
              {[
                { value: "1,200+", label: "Active Affiliates", color: "gradient-text" },
                { value: "₦50M+", label: "Commissions Paid", color: "text-secondary-dark" },
                { value: "40%", label: "Top Tier Commission", color: "gradient-text" },
                { value: "< 24h", label: "Avg. Withdrawal", color: "text-secondary-dark" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center justify-center p-6 text-center">
                  <p className={`text-xl sm:text-2xl font-bold font-heading ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
