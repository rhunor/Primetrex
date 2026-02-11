"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Link2,
  CreditCard,
  Check,
  Shield,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatCurrency } from "@/lib/utils";

type Step = "form" | "payment" | "success";

function RegisterForm() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const [step, setStep] = useState<Step>("form");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: referralCode,
  });
  const [error, setError] = useState("");
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getCaptchaToken = useCallback(async () => {
    if (!executeRecaptcha) return "";
    return executeRecaptcha("register");
  }, [executeRecaptcha]);

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const captchaToken = await getCaptchaToken();

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, captchaToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      setStep("payment");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  }

  async function handlePayment() {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          type: "signup",
          referralCode: formData.referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Payment initialization failed");
        setIsLoading(false);
        return;
      }

      // Store credentials temporarily so we can auto-sign in after payment
      sessionStorage.setItem("ptx_signup_email", formData.email);
      sessionStorage.setItem("ptx_signup_pw", formData.password);

      window.location.href = data.authorizationUrl;
    } catch {
      setError("Failed to initialize payment. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { label: "Account", num: 1 },
          { label: "Payment", num: 2 },
          { label: "Done", num: 3 },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                (step === "form" && i === 0) ||
                (step === "payment" && i <= 1) ||
                (step === "success" && i <= 2)
                  ? "gradient-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {(step === "payment" && i === 0) ||
              (step === "success" && i <= 1) ? (
                <Check className="h-4 w-4" />
              ) : (
                s.num
              )}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {s.label}
            </span>
            {i < 2 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Form */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold font-heading text-foreground">
              Create your account
            </h1>
            <p className="mt-2 text-muted-foreground">
              Join Primetrex and start earning{" "}
              <span className="font-semibold text-primary">
                50% commissions
              </span>{" "}
              on every referral.
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm text-foreground">
                One-time signup fee:{" "}
                <span className="font-bold text-primary">
                  {formatCurrency(siteConfig.signupFee)}
                </span>
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  icon={<User className="h-4 w-4" />}
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  icon={<User className="h-4 w-4" />}
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" />}
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                icon={<Lock className="h-4 w-4" />}
                required
                minLength={8}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                icon={<Lock className="h-4 w-4" />}
                required
                minLength={8}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />

              <Input
                label="Referral Code (optional)"
                placeholder="Enter referral code"
                icon={<Link2 className="h-4 w-4" />}
                value={formData.referralCode}
                onChange={(e) =>
                  setFormData({ ...formData, referralCode: e.target.value })
                }
              />

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </div>

              {error && (
                <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Continue to Payment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              This site is protected by reCAPTCHA and the Google{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Terms of Service
              </a>{" "}
              apply.
            </p>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {/* Step 2: Payment */}
        {step === "payment" && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold font-heading text-foreground">
              Complete Payment
            </h1>
            <p className="mt-2 text-muted-foreground">
              Pay the one-time signup fee to activate your affiliate account.
            </p>

            {/* Email verification notice */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/5 px-4 py-3">
              <Mail className="h-5 w-5 text-secondary-dark flex-shrink-0" />
              <p className="text-sm text-foreground">
                A verification email has been sent to{" "}
                <span className="font-medium">{formData.email}</span>. Please
                check your inbox and verify your email.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Item</span>
                  <span className="font-medium">Affiliate Signup Fee</span>
                </div>
                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold font-heading gradient-text">
                    {formatCurrency(siteConfig.signupFee)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                Secured by Paystack. Your payment information is encrypted.
              </div>

              {error && (
                <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                onClick={handlePayment}
                className="w-full"
                size="lg"
                isLoading={isLoading}
              >
                Pay {formatCurrency(siteConfig.signupFee)} with Paystack
                <CreditCard className="h-4 w-4" />
              </Button>

              <button
                onClick={() => setStep("form")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Back to form
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-foreground">
                What you get:
              </p>
              {[
                "Personal affiliate dashboard",
                "Unique referral link",
                "50% commission on all direct referrals",
                "10% commission on sub-referrals (Tier 2)",
                "Real-time earnings tracking",
                "Bank withdrawal support",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-secondary-dark flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-8"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20 text-secondary-dark mx-auto mb-6">
              <Check className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-foreground">
              Welcome to Primetrex!
            </h1>
            <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
              Your account is active. Sign in to access your dashboard and start
              earning commissions.
            </p>
            <Link href="/login">
              <Button size="lg" className="mt-8">
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RegisterFormWrapper() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

export default function RegisterPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    // Fallback: render without reCAPTCHA provider if key not set
    return <RegisterFormWrapper />;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <RegisterFormWrapper />
    </GoogleReCaptchaProvider>
  );
}
