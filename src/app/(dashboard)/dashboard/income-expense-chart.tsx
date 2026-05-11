"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { IncomeExpenseArea } from "@/components/charts/area-chart";
import { buildDailySeries, buildMonthlySeriesForYear } from "@/lib/analytics";

type DataPoint = { amount: number; date: string };

type Props = {
  incomes: DataPoint[];
  expenses: DataPoint[];
  title: string;
};

export function IncomeExpenseChart({
  incomes,
  expenses,
  title,
}: Props) {
  const [view, setView] = React.useState<"daily" | "monthly">("monthly");
  const [year, setYear] = React.useState(new Date().getFullYear());

  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    incomes.forEach((i) => years.add(new Date(i.date).getFullYear()));
    expenses.forEach((e) => years.add(new Date(e.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [incomes, expenses]);

  const data = React.useMemo(() => {
    if (view === "daily") {
      return {
        income: buildDailySeries(incomes, 30),
        expense: buildDailySeries(expenses, 30),
        subtitle: "Last 30 days (Daily)",
      };
    }
    return {
      income: buildMonthlySeriesForYear(incomes, year),
      expense: buildMonthlySeriesForYear(expenses, year),
      subtitle: `Full ${year} breakdown (Monthly)`,
    };
  }, [view, incomes, expenses, year]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{data.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 self-end">
          {view === "monthly" && (
            <Select 
              value={year.toString()} 
              onValueChange={(v) => setYear(parseInt(v))}
            >
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
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="text-xs px-3">Daily</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <IncomeExpenseArea
          income={data.income}
          expense={data.expense}
        />
      </CardContent>
    </Card>
  );
}
