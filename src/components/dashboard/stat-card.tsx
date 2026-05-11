"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  label: string;
  value: number;
  currency: string;
  icon: LucideIcon;
  trend?: number | null;
  variant?: "default" | "primary" | "success" | "destructive" | "warning";
  hint?: string;
  delay?: number;
};

const variantStyles: Record<NonNullable<Props["variant"]>, string> = {
  default: "from-foreground/5 to-foreground/10",
  primary: "from-primary/15 via-primary/5 to-accent/15",
  success: "from-success/15 to-success/5",
  destructive: "from-destructive/15 to-destructive/5",
  warning: "from-warning/15 to-warning/5",
};

const iconStyles: Record<NonNullable<Props["variant"]>, string> = {
  default: "bg-foreground/10 text-foreground",
  primary: "bg-premium-gradient text-white",
  success: "bg-success text-success-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  warning: "bg-warning text-warning-foreground",
};

export function StatCard({
  label,
  value,
  currency,
  icon: Icon,
  trend,
  variant = "default",
  hint,
  delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
    >
      <Card className={cn("relative overflow-hidden border")}>
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br pointer-events-none",
            variantStyles[variant],
          )}
        />
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {formatCurrency(value, currency)}
              </p>
              {hint && (
                <p className="text-xs text-muted-foreground mt-1">{hint}</p>
              )}
            </div>
            <div
              className={cn(
                "grid place-items-center w-9 h-9 rounded-lg shrink-0",
                iconStyles[variant],
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
          </div>
          {typeof trend === "number" && (
            <div
              className={cn(
                "stat-pill mt-3",
                trend >= 0
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(trend).toFixed(1)}% vs last
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
