"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-secondary-dark" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-foreground">
              Check your email
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              If an account exists for{" "}
              <span className="font-medium text-foreground">{email}</span>, we&apos;ve
              sent a password reset link. It expires in 1 hour.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Didn&apos;t get it? Check your spam folder or{" "}
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>

            <h1 className="text-3xl font-bold font-heading text-foreground">
              Forgot your password?
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enter your email address and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                required
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && (
                <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
