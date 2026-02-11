"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  MessageSquare,
  Send,
  MapPin,
  Phone,
  ArrowRight,
} from "lucide-react";
import { siteConfig } from "@/config/site";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Integrate with email service / Server Action
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 gradient-hero" />
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 h-64 w-64 rounded-full bg-primary/20 blur-[100px]"
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-secondary">
              Contact Us
            </span>
            <h1 className="mt-4 text-4xl font-bold font-heading text-white md:text-5xl lg:text-6xl">
              Get In <span className="text-secondary">Touch</span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed">
              Have questions about the affiliate program? Need help getting
              started? We&apos;re here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3"
            >
              <h2 className="text-2xl font-bold font-heading text-foreground mb-2">
                Send Us a Message
              </h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form below and we&apos;ll get back to you within 24
                hours.
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-secondary-dark/20 bg-secondary/10 p-8 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-dark/20 text-secondary-dark mx-auto mb-4">
                    <Send className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-foreground">
                    Message Sent!
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Thank you for reaching out. We&apos;ll get back to you
                    shortly.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      placeholder="John"
                      required
                    />
                    <Input
                      label="Last Name"
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    icon={<Mail className="h-4 w-4" />}
                    required
                  />
                  <Input
                    label="Subject"
                    placeholder="How can we help?"
                    icon={<MessageSquare className="h-4 w-4" />}
                    required
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Tell us more about your question..."
                      required
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto"
                    isLoading={isSubmitting}
                  >
                    Send Message
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold font-heading text-foreground mb-6">
                  Other Ways to Reach Us
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      support@primetrex.com
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      We reply within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Telegram</h3>
                    <a
                      href={siteConfig.links.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-1 block"
                    >
                      Join our Telegram community
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fastest way to get support
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Phone</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      +234 XXX XXX XXXX
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mon–Fri, 9am–5pm WAT
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Office</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Lagos, Nigeria
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ teaser */}
              <div className="rounded-2xl border border-border bg-muted/50 p-6">
                <h3 className="font-semibold font-heading text-foreground mb-2">
                  Common Questions
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">Q:</span>
                    <span>Is it free to join the affiliate program?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary-dark font-bold">A:</span>
                    <span>
                      Yes, creating an account and getting your referral link is
                      completely free.
                    </span>
                  </li>
                  <li className="flex items-start gap-2 pt-2 border-t border-border">
                    <span className="text-primary font-bold">Q:</span>
                    <span>What is the minimum withdrawal amount?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary-dark font-bold">A:</span>
                    <span>
                      The minimum withdrawal amount is ₦10,000.
                    </span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
