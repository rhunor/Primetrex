"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { dashboardNav } from "@/config/navigation";
import { LogOut, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col relative overflow-hidden">
      {/* Decorative depth — radial glow at bottom */}
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 right-0 h-32 w-32 rounded-full bg-secondary/5 blur-2xl" />

      {/* Logo */}
      <div className="relative flex items-center justify-between px-6 py-6">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logos/SVG/light-comb.svg"
            alt="Primetrex"
            width={140}
            height={36}
          />
        </Link>
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="lg:hidden text-white/40 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-lg p-1"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {dashboardNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-active text-white shadow-lg shadow-primary/20"
                  : "text-white/50 hover:bg-sidebar-hover hover:text-white"
              )}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-3 py-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/50 hover:bg-sidebar-hover hover:text-white transition-all duration-200"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar border-r border-white/5">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
