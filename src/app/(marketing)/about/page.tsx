"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Target,
  Eye,
  Shield,
  Clock,
  Layers,
  Heart,
  ArrowRight,
} from "lucide-react";

const values = [
  {
    icon: Clock,
    title: "Sustainability Over Speed",
    description:
      "We prioritise long-term viability above rapid gains. Growth that cannot survive market cycles is rejected, no matter how attractive it looks in the short term.",
  },
  {
    icon: Layers,
    title: "Structure Before Ambition",
    description:
      "We believe wealth is built through systems, governance, and repeatable processes. Personal heroics and unchecked risk have no place in a serious financial business.",
  },
  {
    icon: Shield,
    title: "Patience as a Competitive Advantage",
    description:
      "We value consistency, restraint, and time in the market. Wealth is treated as a process, not an event.",
  },
];

const promises = [
  { label: "Transparency", description: "Full visibility into your earnings, referrals, and payouts at all times." },
  { label: "Sustainability", description: "Building systems that work long-term, not short-lived hype." },
  { label: "100% Satisfaction", description: "We help our affiliates make money with tools and support that actually work." },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 gradient-hero" />
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[120px]"
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-secondary">
              About Primetrex
            </span>
            <h1 className="mt-4 text-4xl font-bold font-heading text-white md:text-5xl lg:text-6xl">
              Helping People Build a Business in{" "}
              <span className="text-secondary">Finance</span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed">
              Primetrex is here to help traders learn, grow, and trade with
              confidence. Our platform gives you simple tools, expert advice, and
              easy-to-follow signals to guide your trading decisions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-white mb-6">
                <Target className="h-7 w-7" />
              </div>
              <h2 className="text-3xl font-bold font-heading text-foreground">
                Our Mission
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
                To help people build a business in finance without becoming a
                trader. We do 80% of the work for them and the remaining 20% is
                done with them, starting with Forex but expanding to stocks and
                crypto.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/20 text-secondary-dark mb-6">
                <Eye className="h-7 w-7" />
              </div>
              <h2 className="text-3xl font-bold font-heading text-foreground">
                Our Vision
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
                We envision a future where individuals can participate in the
                financial sector as owners rather than operators, building
                enduring, income-generating financial businesses that function
                independently of their constant time, attention, or technical
                expertise.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 md:py-32 bg-muted/50">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Our Values
            </span>
            <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl">
              What We Believe In
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
                    <value.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold font-heading text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Our Promise
            </span>
            <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl">
              What You Can Expect
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {promises.map((promise, index) => (
              <motion.div
                key={promise.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-6 rounded-2xl border border-border bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20 text-secondary-dark flex-shrink-0">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold font-heading text-foreground mb-1">
                    {promise.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {promise.description}
                  </p>
                </div>
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
              Ready to Join the{" "}
              <span className="text-secondary">Primetrex Family?</span>
            </h2>
            <p className="mt-6 text-lg text-white/60">
              Start building your financial business today with our affiliate
              program.
            </p>
            <div className="mt-10">
              <Link href="/register">
                <Button size="lg" variant="secondary">
                  Get Started Free
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
