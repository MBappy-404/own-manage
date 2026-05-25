"use client";

import * as React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseTrendArea } from "@/components/charts/area-chart";
import {
  buildCurrentMonthDailySeries,
  buildDailySeries,
  buildMonthlySeriesForYear,
} from "@/lib/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/provider";

type ExpensePoint = { amount: number; date: Date };

type Props = {
  items: ExpensePoint[];
  title: string;
};

export function ExpenseTrendChart({ items, title }: Props) {
  const { t, locale } = useI18n();
  const [view, setView] = React.useState<"monthly" | "yearly">("monthly");
  const [monthlyRange, setMonthlyRange] = React.useState<"last30" | "currentMonth">(
    "last30",
  );
  const [year, setYear] = React.useState(new Date().getFullYear());

  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    items.forEach((e) => years.add(new Date(e.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  const chart = React.useMemo(() => {
    if (view === "yearly") {
      return {
        data: buildMonthlySeriesForYear(items, year),
        subtitle: t("expense.trendYearlySubtitle", { year: year.toString() }),
      };
    }

    if (monthlyRange === "currentMonth") {
      const now = new Date();
      const monthLabel = format(now, locale === "bn" ? "MMMM yyyy" : "MMMM yyyy");
      return {
        data: buildCurrentMonthDailySeries(items, now),
        subtitle: t("expense.trendThisMonthSubtitle", { month: monthLabel }),
      };
    }

    return {
      data: buildDailySeries(items, 30),
      subtitle: t("expense.trendLast30Subtitle"),
    };
  }, [view, monthlyRange, year, items, t, locale]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{chart.subtitle}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-2 self-end">
          {view === "monthly" ? (
            <Tabs
              value={monthlyRange}
              onValueChange={(v) => setMonthlyRange(v as "last30" | "currentMonth")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="last30" className="text-xs px-3">
                  {t("expense.chartLast30")}
                </TabsTrigger>
                <TabsTrigger value="currentMonth" className="text-xs px-3">
                  {t("expense.chartThisMonth")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v, 10))}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Tabs value={view} onValueChange={(v) => setView(v as "monthly" | "yearly")}>
            <TabsList className="h-8">
              <TabsTrigger value="monthly" className="text-xs px-3">
                {t("expense.chartMonthly")}
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs px-3">
                {t("expense.chartYearly")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ExpenseTrendArea data={chart.data} name={t("expense.trend")} />
      </CardContent>
    </Card>
  );
}
