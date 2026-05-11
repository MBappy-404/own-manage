"use client";

import {
  CartesianGrid,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SavingsTrend({
  data,
}: {
  data: { label: string; income: number; expense: number; savings: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <ReLineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="savings"
            name="Savings"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
