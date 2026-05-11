"use client";

import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export function ExpenseHeatmap({
  data,
  currency,
}: {
  data: { date: string; total: number }[];
  currency: string;
}) {
  const end = startOfDay(new Date());
  const start = subDays(end, 90);
  const days = eachDayOfInterval({ start, end });
  const map = new Map(data.map((d) => [d.date, d.total]));
  const max = Math.max(1, ...data.map((d) => d.total));

  function intensity(v: number) {
    if (!v) return 0;
    const r = v / max;
    if (r > 0.75) return 5;
    if (r > 0.5) return 4;
    if (r > 0.25) return 3;
    if (r > 0.1) return 2;
    return 1;
  }
  const palette = [
    "bg-muted/40",
    "bg-primary/20",
    "bg-primary/35",
    "bg-primary/55",
    "bg-primary/75",
    "bg-primary",
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const v = map.get(key) ?? 0;
        return (
          <div
            key={key}
            className={`w-3.5 h-3.5 rounded-sm ${palette[intensity(v)]}`}
            title={`${format(d, "MMM d")} — ${formatCurrency(v, currency)}`}
          />
        );
      })}
    </div>
  );
}
