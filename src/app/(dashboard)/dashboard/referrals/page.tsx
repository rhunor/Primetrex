"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Users, Loader2 } from "lucide-react";
import { ReferralLinkCard } from "@/components/features/dashboard/referral-link-card";

interface Referral {
  id: string;
  name: string;
  email: string;
  tier: number;
  status: string;
  earnings: number;
  date: string;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, tier1: 0, tier2: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setReferrals(data.allReferrals || []);
          setReferralCode(data.user.referralCode);
          setStats({
            total: data.stats.totalReferrals,
            active: data.stats.activeReferrals,
            tier1: (data.allReferrals || []).filter((r: Referral) => r.tier === 1).length,
            tier2: (data.allReferrals || []).filter((r: Referral) => r.tier === 2).length,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">Referrals</h1>
        <p className="text-muted-foreground mt-1">Manage and track all your referrals</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Tier 1", value: stats.tier1 },
          { label: "Tier 2", value: stats.tier2 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold font-heading text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Referral list */}
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold font-heading text-foreground">All Referrals</h3>
            </div>

            {referrals.length > 0 ? (
              <div className="divide-y divide-border">
                {referrals.map((referral, index) => (
                  <motion.div
                    key={referral.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {referral.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{referral.name}</p>
                        <p className="text-xs text-muted-foreground">{referral.email}</p>
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
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">No referrals yet</p>
                <p className="text-sm text-muted-foreground mt-1">Share your referral link to start earning</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <ReferralLinkCard referralCode={referralCode} />
        </div>
      </div>
    </div>
  );
}
