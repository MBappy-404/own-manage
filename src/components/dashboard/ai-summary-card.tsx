"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

interface AISummaryProps {
  projectedSpending: number;
  monthlyBudget?: number | null;
  currency: string;
  locale: string;
  topInsightMessage?: string;
  healthScore: number;
}

export function AISummaryCard({
  projectedSpending,
  monthlyBudget,
  currency,
  locale,
  topInsightMessage,
  healthScore,
}: AISummaryProps) {
  const { t } = useI18n();

  const isOverBudget = monthlyBudget ? projectedSpending > monthlyBudget : false;

  return (
    <Card className="border-none bg-premium-gradient text-white shadow-xl overflow-hidden relative group">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <Brain className="w-48 h-48 -mr-12 -mt-12" />
      </div>
      
      <CardContent className="p-6 md:p-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> {t("insights.aiAnalysis")}
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold leading-tight">
              {healthScore >= 80 
                ? "আপনার আর্থিক অবস্থা অত্যন্ত চমৎকার!" 
                : healthScore >= 50 
                  ? "আর্থিক অবস্থা স্থিতিশীল, তবে উন্নতির সুযোগ আছে" 
                  : "আপনার খরচের বিষয়ে সতর্ক হওয়া প্রয়োজন"}
            </h2>
            
            <p className="text-white/80 text-sm md:text-base leading-relaxed">
              {topInsightMessage || "আমাদের AI আপনার লেনদেন বিশ্লেষণ করছে। নিয়মিত হিসাব লিখে সঠিক পরামর্শ পান।"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">
                {t("insights.projectedSpend")}
              </p>
              <div className="flex items-end gap-2">
                <span className="text-xl md:text-2xl font-black">
                  {new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
                    style: "currency",
                    currency,
                  }).format(projectedSpending)}
                </span>
                {isOverBudget && (
                  <TrendingUp className="w-5 h-5 text-red-300 mb-1 animate-pulse" />
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">
                {t("dashboard.healthScore")}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xl md:text-2xl font-black">{healthScore}%</span>
                <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    className="h-full bg-white"
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
