"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

type Status = "verifying" | "signing-in" | "success" | "error";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found.");
      return;
    }

    async function verifyAndSignIn() {
      try {
        // Step 1: Verify the payment
        const res = await fetch(`/api/payments/verify?reference=${reference}`);
        const data = await res.json();

        if (!res.ok || !data.verified) {
          setStatus("error");
          setMessage(data.error || "Payment verification failed.");
          return;
        }

        // Step 2: Auto-sign in using stored credentials
        setStatus("signing-in");

        const email = sessionStorage.getItem("ptx_signup_email");
        const password = sessionStorage.getItem("ptx_signup_pw");

        // Clear stored credentials immediately
        sessionStorage.removeItem("ptx_signup_email");
        sessionStorage.removeItem("ptx_signup_pw");

        if (email && password) {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (result?.ok) {
            setStatus("success");
            // Redirect to dashboard after a brief success message
            setTimeout(() => router.push("/dashboard"), 1500);
            return;
          }
        }

        // If auto-sign in fails, still show success but link to login
        setStatus("success");
        setTimeout(() => router.push("/login"), 2000);
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please contact support.");
      }
    }

    verifyAndSignIn();
  }, [reference, router]);

  return (
    <div className="text-center py-8">
      {/* Verifying / Signing in */}
      {(status === "verifying" || status === "signing-in") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {status === "verifying"
              ? "Verifying Payment..."
              : "Setting Up Your Account..."}
          </h1>
          <p className="text-muted-foreground">
            {status === "verifying"
              ? "Please wait while we confirm your payment."
              : "Almost there! Signing you in..."}
          </p>
        </motion.div>
      )}

      {/* Success */}
      {status === "success" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20 text-secondary-dark mx-auto">
            <Check className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold font-heading text-foreground">
            Welcome to Primetrex!
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your account is active. Redirecting you to your dashboard...
          </p>
          <div className="flex h-1.5 w-32 mx-auto rounded-full bg-muted overflow-hidden mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "linear" }}
              className="h-full rounded-full gradient-primary"
            />
          </div>
        </motion.div>
      )}

      {/* Error */}
      {status === "error" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger/10 text-danger mx-auto">
            <X className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Verification Failed
          </h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {message}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <Link href="/register">
              <Button variant="outline">Try Again</Button>
            </Link>
            <Link href="/contact">
              <Button>Contact Support</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
