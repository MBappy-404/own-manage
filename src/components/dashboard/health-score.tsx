"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function HealthScoreCard({ score }: { score: number }) {
  const ringPct = Math.max(0, Math.min(100, score));
  const label =
    score >= 80
      ? "Excellent"
      : score >= 60
      ? "Healthy"
      : score >= 40
      ? "Watch out"
      : "Needs work";
  const color =
    score >= 80
      ? "hsl(var(--success))"
      : score >= 60
      ? "hsl(var(--primary))"
      : score >= 40
      ? "hsl(var(--warning))"
      : "hsl(var(--destructive))";

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-card-radial pointer-events-none" />
      <CardContent className="relative p-5 flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={264}
              strokeDashoffset={264}
              strokeLinecap="round"
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - (ringPct / 100) * 264 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold tabular-nums"
            >
              {Math.round(ringPct)}
            </motion.span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wide font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Financial Health
          </div>
          <p className="text-xl font-bold mt-0.5">{label}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Score based on savings rate, budget adherence, and spending volatility this month.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
