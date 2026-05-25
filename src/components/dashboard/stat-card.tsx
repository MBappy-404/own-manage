"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { CurrencyValue } from "@/components/ui/currency-value";

const iconMap = {
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  DollarSign,
} as const;

export type StatIconName = keyof typeof iconMap;

type Props = {
  label: string;
  value: number;
  currency: string;
  icon: StatIconName;
  trend?: number | null;
  variant?: "default" | "primary" | "success" | "destructive" | "warning" | "premium";
  hint?: string;
  delay?: number;
};

const variantStyles: Record<NonNullable<Props["variant"]>, string> = {
  default: "from-foreground/5 to-foreground/10",
  primary: "from-primary/15 via-primary/5 to-accent/15",
  success: "from-success/15 to-success/5",
  destructive: "from-destructive/15 to-destructive/5",
  warning: "from-warning/15 to-warning/5",
  premium: "from-primary/20 via-accent/10 to-primary/20",
};

const iconStyles: Record<NonNullable<Props["variant"]>, string> = {
  default: "bg-foreground/10 text-foreground",
  primary: "bg-premium-gradient text-white",
  success: "bg-success text-success-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  warning: "bg-warning text-warning-foreground",
  premium: "bg-premium-gradient text-white shadow-lg shadow-primary/20",
};

export function StatCard({
  label,
  value,
  currency,
  icon,
  trend,
  variant = "default",
  hint,
  delay = 0,
}: Props) {
  useI18n();
  const Icon = iconMap[icon];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <Card className={cn("relative overflow-hidden border h-full shadow-sm hover:shadow-md transition-shadow duration-300")}>
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br pointer-events-none",
            variantStyles[variant],
          )}
        />
        <CardContent className="relative p-3.5 sm:p-5 flex flex-col h-full justify-between">
          <div className="flex items-start justify-between gap-1 flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-tight truncate">
                {label}
              </p>
              <p className="mt-1 sm:mt-2 text-base sm:text-2xl font-bold tracking-tight text-foreground truncate max-w-full">
                <CurrencyValue value={value} currency={currency} />
              </p>
              {hint && (
                <p className="text-[9px] sm:text-xs text-muted-foreground mt-1.5 leading-tight font-medium break-words">
                  {hint}
                </p>
              )}
            </div>
            <div
              className={cn(
                "grid place-items-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg shrink-0",
                iconStyles[variant],
              )}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          {typeof trend === "number" ? (
            <div
              className={cn(
                "stat-pill mt-2 sm:mt-3 w-fit text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5",
                trend >= 0
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              ) : (
                <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              )}
              {Math.abs(trend).toFixed(1)}% vs last
            </div>
          ) : (
            <div className="h-[20px] sm:h-[26px] mt-2 sm:mt-3" /> // Placeholder to keep height consistent
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
