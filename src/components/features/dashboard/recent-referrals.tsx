"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
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
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {referral.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{referral.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(referral.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={referral.tier === 1 ? "info" : "success"}>
                  Tier {referral.tier}
                </Badge>
                <Badge variant={referral.status === "active" ? "success" : "warning"}>
                  {referral.status}
                </Badge>
                <span className="text-sm font-medium text-foreground min-w-[80px] text-right">
                  {referral.earnings > 0 ? formatCurrency(referral.earnings) : "—"}
                </span>
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
