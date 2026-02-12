"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Adebayo M.",
    role: "Affiliate since 2024",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&q=90",
    content:
      "I was skeptical at first, but within my first month I earned over ₦200,000 just from referrals. The commission structure is genuinely the best I've seen.",
    rating: 5,
  },
  {
    name: "Chioma A.",
    role: "Affiliate since 2024",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face&q=90",
    content:
      "The 2-tier system is a game changer. I earn from my referrals AND their referrals. It's truly passive income. Primetrex has changed my financial life.",
    rating: 5,
  },
  {
    name: "Emmanuel O.",
    role: "Affiliate since 2025",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face&q=90",
    content:
      "Withdrawals are fast and smooth. I requested ₦150,000 and it hit my bank account the same day. This is legit.",
    rating: 5,
  },
];

export function SocialProofSection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-linear-to-b from-background via-primary/2 to-background" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Testimonials
          </span>
          <h2 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl lg:text-5xl">
            Trusted by{" "}
            <span className="gradient-text">Real Affiliates</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Hear from people already earning with Primetrex.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-primary/10 mb-4" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
