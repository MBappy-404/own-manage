"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const items = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/income", labelKey: "nav.income", icon: TrendingUp },
  { href: "/expenses", labelKey: "nav.expenses", icon: TrendingDown },
  { href: "/insights", labelKey: "nav.insights", icon: Brain },
  { href: "/leaderboard", labelKey: "nav.ranks", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/85 backdrop-blur-xl safe-bottom">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/dashboard" && pathname.startsWith(it.href));
          return (
            <li key={it.href} className="flex">
              <Link
                href={it.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <it.icon className="w-5 h-5" />
                {t(it.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
