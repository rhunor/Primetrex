"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, CheckCircle, AlertTriangle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-danger" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Invalid reset link</h1>
        <p className="mt-2 text-muted-foreground">
          This link is missing or malformed. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          Request new reset link →
        </Link>
      </motion.div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
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
        {success ? (
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
              Password updated!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Your password has been reset successfully. Redirecting you to sign in...
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Sign in now →
            </Link>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-3xl font-bold font-heading text-foreground">
              Set new password
            </h1>
            <p className="mt-2 text-muted-foreground">
              Choose a strong password for your account.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <Input
                label="New password"
                type="password"
                placeholder="At least 8 characters"
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="Repeat your password"
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {/* Strength hint */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        password.length >= 12 ? "w-full bg-success" :
                        password.length >= 8  ? "w-2/3 bg-warning" :
                        "w-1/3 bg-danger"
                      }`}
                    />
                  </div>
                  <p className={`text-xs ${
                    password.length >= 12 ? "text-success" :
                    password.length >= 8  ? "text-warning" :
                    "text-danger"
                  }`}>
                    {password.length >= 12 ? "Strong password" :
                     password.length >= 8  ? "Good — try adding numbers or symbols" :
                     "Too short — minimum 8 characters"}
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Reset Password
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
