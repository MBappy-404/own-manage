"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  CreditCard,
  FileText,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Sparkles,
  Trophy,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/income", labelKey: "nav.income", icon: TrendingUp },
  { href: "/expenses", labelKey: "nav.expenses", icon: TrendingDown },
  { href: "/accounts", labelKey: "nav.accounts", icon: CreditCard },
  { href: "/debts", labelKey: "nav.debts", icon: Users },
  { href: "/insights", labelKey: "nav.insights", icon: Brain },
  { href: "/leaderboard", labelKey: "nav.leaderboard", icon: Trophy, adminOnly: true },
  { href: "/savings", labelKey: "nav.savings", icon: PiggyBank },
  { href: "/reports", labelKey: "nav.reports", icon: FileText },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { data: session } = useSession();

  const isAdmin = session?.user?.email === "sadikulsad0810@gmail.com";

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  // Close on route change
  React.useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-card border-r shadow-2xl md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5"
                onClick={onClose}
              >
                <div className="grid place-items-center w-9 h-9 rounded-xl bg-premium-gradient text-white shadow-lg">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold tracking-tight text-sm">OwnManage</p>
                  <p className="text-[10px] text-muted-foreground -mt-0.5">
                    {t("common.tagline")}
                  </p>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="grid place-items-center w-8 h-8 rounded-lg hover:bg-accent/60 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {filteredNavItems.map((item, idx) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "text-foreground bg-premium-gradient/15 border border-primary/20 shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-[18px] h-[18px]",
                          active && "text-primary"
                        )}
                      />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Footer tip */}
            <div className="m-3 rounded-xl border bg-premium-gradient/10 p-3">
              <Sparkles className="w-4 h-4 text-primary mb-1" />
              <p className="text-xs font-medium">
                {t("settings.tip").split(".")[0]}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("dashboard.smartInsightsSubtitle")}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
