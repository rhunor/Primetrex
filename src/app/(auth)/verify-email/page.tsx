"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowRight, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { update } = useSession();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success) {
          // Refresh the JWT so the dashboard no longer shows the banner.
          // Pass {} to explicitly trigger the "update" path in the JWT callback.
          await update({});
          setStatus("success");
          setMessage(data.message === "Email already verified" ? "Your email is already verified." : "Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
          if (data.error?.toLowerCase().includes("expired")) {
            setIsExpired(true);
          }
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token, update]);

  async function handleResend() {
    if (resendState !== "idle") return;
    setResendState("sending");
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8"
    >
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Verifying your email...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20 text-secondary-dark">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Email Verified!
          </h1>
          <p className="text-muted-foreground max-w-sm">{message}</p>
          <Link href="/dashboard">
            <Button size="lg" className="mt-4">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger/20 text-danger">
            <XCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {isExpired ? "Link Expired" : "Verification Failed"}
          </h1>
          <p className="text-muted-foreground max-w-sm">{message}</p>

          {isExpired ? (
            resendState === "sent" ? (
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
                  <Mail className="h-6 w-6 text-secondary-dark" />
                </div>
                <p className="text-sm text-muted-foreground">New verification email sent! Check your inbox.</p>
              </div>
            ) : (
              <Button
                size="lg"
                className="mt-4"
                onClick={handleResend}
                disabled={resendState === "sending"}
              >
                {resendState === "sending" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Mail className="h-4 w-4" /> Send New Verification Email</>
                )}
              </Button>
            )
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link href="/dashboard">
                <Button size="lg">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Back to Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
