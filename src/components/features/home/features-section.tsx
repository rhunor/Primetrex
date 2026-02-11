"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import {
  Link2,
  BarChart3,
  Wallet,
  Bell,
  Shield,
  MessageCircle,
  Users,
  Repeat,
} from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Unique Referral Link",
    description:
      "Sign up and instantly get your personal referral link. Share it anywhere and start earning.",
  },
  {
    icon: Users,
    title: "2-Tier Commission",
    description:
      "Earn from your direct referrals (Tier 1) and from people they refer (Tier 2). Double the income.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track your clicks, conversions, and earnings in real-time with beautiful, detailed charts.",
  },
  {
    icon: Wallet,
    title: "Easy Withdrawals",
    description:
      "Withdraw your earnings directly to your Nigerian bank account with just a few clicks.",
  },
  {
    icon: Repeat,
    title: "Recurring Income",
    description:
      "Earn commission every single month your referrals stay subscribed. True passive income.",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description:
      "Get real-time alerts via email and Telegram when you earn commissions or referrals sign up.",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description:
      "Bank-level security with encrypted data, secure sessions, and protected transactions.",
  },
  {
    icon: MessageCircle,
    title: "24/7 AI Support",
    description:
      "Our AI chatbot answers your questions instantly, any time of day. Human support also available.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/50">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl lg:text-5xl">
            Everything You Need to{" "}
            <span className="gradient-text">Earn More</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Our platform is packed with tools to help you maximize your referral
            earnings and grow your network.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card hover className="h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold font-heading text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
