"use client";

import { motion } from "motion/react";
import { Users, Layers } from "lucide-react";
import { siteConfig } from "@/config/site";

export function CommissionInfo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold font-heading text-foreground mb-4">
        Your Commission Rates
      </h3>

      <div className="space-y-4">
        {/* Tier 1 */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Tier 1 — Direct</p>
            <p className="text-2xl font-bold font-heading gradient-text">
              {siteConfig.commission.tier1Rate}%
            </p>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/5 border border-secondary-dark/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20 shrink-0">
            <Layers className="h-5 w-5 text-secondary-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Tier 2 — Sub-referrals</p>
            <p className="text-2xl font-bold font-heading text-secondary-dark">
              {siteConfig.commission.tier2Rate}%
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Same rate for every affiliate — no tiers to climb.
      </p>
    </motion.div>
  );
}
