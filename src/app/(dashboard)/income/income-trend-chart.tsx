"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IncomeTrendArea } from "@/components/charts/area-chart";
import { buildMonthlySeriesForYear } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n/provider";

type IncomePoint = { amount: number; date: Date };

type Props = {
  items: IncomePoint[];
  title: string;
};

export function IncomeTrendChart({ items, title }: Props) {
  const { t } = useI18n();
  const [year, setYear] = React.useState(new Date().getFullYear());

  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    items.forEach((i) => years.add(new Date(i.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [items]);

  const chart = React.useMemo(() => {
    const data = buildMonthlySeriesForYear(items, year);
    return {
      data,
      subtitle: t("income.trendYearlySubtitle", { year: year.toString() }),
    };
  }, [items, year, t]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{chart.subtitle}</p>
        </div>
        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v, 10))}>
          <SelectTrigger className="w-[100px] h-8 text-xs self-end">
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
      </CardHeader>
      <CardContent>
        <IncomeTrendArea data={chart.data} name={title} />
      </CardContent>
    </Card>
  );
}
