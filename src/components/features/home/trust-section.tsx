"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ShieldCheck, Headphones, BarChart3 } from "lucide-react";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Bank-Level Security",
    description: "256-bit SSL encryption, secure sessions, and PCI-compliant payment processing to keep your funds safe.",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop&q=90",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "Real humans and AI support available around the clock via Telegram and in-app chat.",
    image: "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=800&h=600&fit=crop&q=90",
  },
  {
    icon: BarChart3,
    title: "Transparent Analytics",
    description: "Track every click, every referral, and every earning in real-time on your dashboard.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=90",
  },
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
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Why Primetrex
          </span>
          <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl lg:text-5xl">
            A Platform You Can{" "}
            <span className="gradient-text">Actually Trust</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            We built Primetrex with transparency, security, and our affiliates&apos; success at its core.
          </p>
        </motion.div>

        {/* Grid - alternating image/text layout */}
        <div className="space-y-16 md:space-y-24">
          {trustPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center ${
                index % 2 === 1 ? "md:direction-rtl" : ""
              }`}
            >
              {/* Image */}
              <div
                className={`relative ${index % 2 === 1 ? "md:order-2" : ""}`}
              >
                <div className="absolute -inset-3 bg-primary/5 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg">
                  <Image
                    src={point.image}
                    alt={point.title}
                    width={800}
                    height={600}
                    className="w-full h-56 md:h-80 object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-primary-dark/30 to-transparent" />
                </div>
              </div>

              {/* Text */}
              <div
                className={`${index % 2 === 1 ? "md:order-1" : ""}`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-white mb-6">
                  <point.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold font-heading text-foreground md:text-3xl">
                  {point.title}
                </h3>
                <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                  {point.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
