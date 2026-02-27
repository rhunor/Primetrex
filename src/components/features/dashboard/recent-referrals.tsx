"use client";

import { motion } from "motion/react";
import { formatCurrency } from "@/lib/utils";
import { Users } from "lucide-react";

interface ReferralItem {
  id: string;
  name: string;
  email: string;
  tier: number;
  status: string;
  earnings: number;
  date: string;
}

interface RecentReferralsProps {
  referrals: ReferralItem[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function RecentReferrals({ referrals }: RecentReferralsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className="rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold font-heading text-foreground">
          Recent Referrals
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your latest referral activity
        </p>
      </div>

      {referrals.length > 0 ? (
        <div className="divide-y divide-border">
          {referrals.map((referral, index) => (
            <motion.div
              key={referral.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
              className="flex items-center gap-3 px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0">
                {referral.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{referral.name}</p>
                  <span className="text-sm font-medium text-foreground flex-shrink-0">
                    {referral.earnings > 0 ? formatCurrency(referral.earnings) : "—"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{formatDate(referral.date)}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${referral.tier === 1 ? "bg-primary/10 text-primary" : "bg-secondary/20 text-secondary-dark"}`}>
                    T{referral.tier}
                  </span>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${referral.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {referral.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            No referrals yet. Share your link to start earning!
          </p>
        </div>
      )}
    </motion.div>
  );
}
