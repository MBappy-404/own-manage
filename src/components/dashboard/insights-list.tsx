"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Calendar,
  Flame,
  PieChart,
  PiggyBank,
  ShieldCheck,
  Siren,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wallet,
} from "lucide-react";
import type { Insight } from "@/lib/insights";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Wallet,
  PieChart,
  Utensils,
  Calendar,
  Flame,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Siren,
  Sparkles,
};

const toneStyles = {
  positive:
    "border-success/30 bg-success/10 text-foreground [&_.tone-icon]:bg-success [&_.tone-icon]:text-success-foreground",
  neutral:
    "border-border bg-card/60 [&_.tone-icon]:bg-primary [&_.tone-icon]:text-primary-foreground",
  warning:
    "border-warning/30 bg-warning/10 [&_.tone-icon]:bg-warning [&_.tone-icon]:text-warning-foreground",
  danger:
    "border-destructive/30 bg-destructive/10 [&_.tone-icon]:bg-destructive [&_.tone-icon]:text-destructive-foreground",
} as const;

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (!insights.length) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        <Brain className="w-6 h-6 mx-auto mb-2 text-primary" />
        Add a few transactions and your AI insights will appear here.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {insights.map((i, idx) => {
        const Icon: React.ComponentType<{ className?: string }> =
          (i.icon ? iconMap[i.icon] : undefined) ?? Sparkles;
        return (
          <motion.div
            key={i.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className={cn(
              "rounded-xl border p-4 flex items-start gap-3",
              toneStyles[i.tone],
            )}
          >
            <div className="tone-icon grid place-items-center w-9 h-9 rounded-lg shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{i.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {i.message}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
