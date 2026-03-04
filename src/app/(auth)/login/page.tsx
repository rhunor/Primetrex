"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";

type Step = "credentials" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Credentials step state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP step state
  const [otp, setOtp] = useState("");

  async function handleCredentialsSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/pre-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      if (data.needsOTP) {
        // New device — OTP sent to email
        setStep("otp");
        return;
      }

      // Known device — log in directly
      await doSignIn();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOTPSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid code. Please try again.");
        return;
      }

      // OTP verified — now sign in
      await doSignIn();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function doSignIn() {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setStep("credentials");
      return;
    }

    if (result?.ok) {
      router.push("/dashboard");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence mode="wait">
        {step === "credentials" ? (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-3xl font-bold font-heading text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to your Primetrex affiliate account
            </p>

            <form onSubmit={handleCredentialsSubmit} className="mt-8 space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                required
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold font-heading text-foreground">
                Verify It&apos;s You
              </h1>
            </div>
            <p className="mt-2 text-muted-foreground">
              We sent a 6-digit verification code to{" "}
              <span className="font-medium text-foreground">{email}</span>. Enter
              it below to continue.
            </p>

            <form onSubmit={handleOTPSubmit} className="mt-8 space-y-5">
              <Input
                label="Verification Code"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                required
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />

              <p className="text-xs text-muted-foreground">
                The code expires in 10 minutes. Check your spam folder if you
                don&apos;t see it.
              </p>

              {error && (
                <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Verify & Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setOtp("");
                setError("");
              }}
              className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
