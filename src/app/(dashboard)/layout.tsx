"use client";

import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Mail, CheckCircle, X } from "lucide-react";

function EmailVerificationBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const searchParams = useSearchParams();

  const isEmailVerified = (session?.user as unknown as Record<string, unknown>)?.isEmailVerified as boolean;
  const emailSent = searchParams.get("emailSent") === "1";

  if (isEmailVerified || dismissed || !session) return null;

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

  if (emailSent || resendState === "sent") {
    return (
      <div className="flex items-center justify-between gap-3 bg-secondary/10 border-b border-secondary/20 px-6 py-3">
        <div className="flex items-center gap-2.5 text-sm">
          <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
          <span className="text-foreground">
            Verification email sent! Check your inbox and click the link to verify your account.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-warning/10 border-b border-warning/20 px-6 py-3">
      <div className="flex items-center gap-2.5 text-sm">
        <Mail className="h-4 w-4 text-warning shrink-0" />
        <span className="text-foreground">
          Please verify your email address to secure your account.{" "}
          <button
            onClick={handleResend}
            disabled={resendState !== "idle"}
            className="font-semibold text-warning hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {resendState === "sending" ? "Sending..." : "Resend email"}
          </button>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <Suspense>
          <EmailVerificationBanner />
        </Suspense>
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
      </div>
      <BottomNav />
      <ScrollToTop />
    </div>
  );
}
