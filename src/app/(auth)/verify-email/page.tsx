"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

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
          <Link href="/login">
            <Button size="lg" className="mt-4">
              Continue to Login
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
            Verification Failed
          </h1>
          <p className="text-muted-foreground max-w-sm">{message}</p>
          <Link href="/register">
            <Button variant="outline" size="lg" className="mt-4">
              Back to Register
            </Button>
          </Link>
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
