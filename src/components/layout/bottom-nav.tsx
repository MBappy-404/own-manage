"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  Menu,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

import { useSession } from "next-auth/react";

const items = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/income", labelKey: "nav.income", icon: TrendingUp },
  { href: "/expenses", labelKey: "nav.expenses", icon: TrendingDown },
  { href: "/insights", labelKey: "nav.insights", icon: Brain },
  { href: "/leaderboard", labelKey: "nav.ranks", icon: Trophy, adminOnly: true },
];

interface BottomNavProps {
  onMenuClick?: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { data: session } = useSession();

  const isAdmin = session?.user?.email === "sadikulsad0810@gmail.com";

  const filteredItems = items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/85 backdrop-blur-xl safe-bottom">
      <ul className={cn(
        "grid",
        filteredItems.length === 5 ? "grid-cols-6" : "grid-cols-5"
      )}>
        {/* Menu Button */}
        <li className="flex">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors text-muted-foreground hover:text-primary"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
            Menu
          </button>
        </li>

        {filteredItems.map((it) => {
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
