"use client";

import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { Menu, ShieldCheck } from "lucide-react";

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const { data: session } = useSession();
  const name = session?.user?.name || "Admin";

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/80 backdrop-blur-xl px-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-danger" />
          Admin Panel
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-danger font-medium">Administrator</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-danger text-white text-sm font-semibold">
          A
        </div>
      </div>
    </motion.header>
  );
}
