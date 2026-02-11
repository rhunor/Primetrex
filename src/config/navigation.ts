import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Wallet,
  Settings,
  ShieldCheck,
  CreditCard,
  ArrowDownUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export const publicNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contact", href: "/contact" },
];

export const dashboardNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Referrals", href: "/dashboard/referrals", icon: Users },
  { label: "Earnings", href: "/dashboard/earnings", icon: TrendingUp },
  { label: "Withdrawals", href: "/dashboard/withdrawals", icon: Wallet },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin", icon: ShieldCheck },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: ArrowDownUp },
];
