"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Sparkles,
  Trophy,
  Wallet,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/income", labelKey: "nav.income", icon: TrendingUp },
  { href: "/expenses", labelKey: "nav.expenses", icon: TrendingDown },
  { href: "/insights", labelKey: "nav.insights", icon: Brain },
  { href: "/leaderboard", labelKey: "nav.leaderboard", icon: Trophy },
  { href: "/savings", labelKey: "nav.savings", icon: PiggyBank },
  { href: "/reports", labelKey: "nav.reports", icon: FileText },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card/40 backdrop-blur-xl sticky top-0 h-svh">
      <Link href="/dashboard" className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-premium-gradient text-white shadow-lg">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold tracking-tight">OwnManage</p>
          <p className="text-[10px] text-muted-foreground -mt-0.5">
            Personal Finance
          </p>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-lg bg-premium-gradient/15 border border-primary/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className={cn("w-4 h-4 relative", active && "text-primary")} />
              <span className="relative">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border bg-premium-gradient/10 p-3">
        <Sparkles className="w-4 h-4 text-primary mb-1" />
        <p className="text-xs font-medium">Pro tip</p>
        <p className="text-[11px] text-muted-foreground">
          Log a transaction daily for richer AI insights.
        </p>
      </div>
    </aside>
  );
}
