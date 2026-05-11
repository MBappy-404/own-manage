"use client";

import React from "react";
import {
  Area,
  AreaChart as ReAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Datum = { label: string; total: number; total2?: number };

export function IncomeExpenseArea({
  income,
  expense,
}: {
  income: { label: string; total: number }[];
  expense: { label: string; total: number }[];
}) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const data: Datum[] = income.map((p, i) => ({
    label: p.label,
    total: p.total,
    total2: expense[i]?.total ?? 0,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <ReAreaChart data={data} margin={{ top: 10, right: 8, bottom: 30, left: -20 }}>
          <defs>
            <linearGradient id="g-income" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.45} />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g-expense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            minTickGap={isMobile ? 10 : 0}
            interval={isMobile ? 1 : 0}
            tickFormatter={(v) => isMobile ? v.split(" ")[0] : v}
            angle={isMobile ? 0 : -45}
            textAnchor={isMobile ? "middle" : "end"}
            height={isMobile ? 30 : 60}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Income"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            fill="url(#g-income)"
          />
          <Area
            type="monotone"
            dataKey="total2"
            name="Expense"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            fill="url(#g-expense)"
          />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
