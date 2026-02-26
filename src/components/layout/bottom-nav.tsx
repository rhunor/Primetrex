"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, TrendingUp, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Referrals", href: "/dashboard/referrals", icon: Users },
  { label: "Earnings", href: "/dashboard/earnings", icon: TrendingUp },
  { label: "Withdrawals", href: "/dashboard/withdrawals", icon: Wallet },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-sidebar/95 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-around px-1 pt-2 pb-5">
        {mobileNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 flex-1 min-w-0 py-1"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/40"
                    : "text-white/40"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors leading-none",
                  isActive ? "text-white" : "text-white/40"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
