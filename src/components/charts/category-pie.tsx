"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, getCategoryColor, prettyEnum } from "@/lib/utils";

export function CategoryPie({
  data,
  currency,
}: {
  data: { category: string; total: number }[];
  currency: string;
}) {
  if (!data.length) {
    return (
      <div className="h-64 grid place-items-center text-sm text-muted-foreground">
        No category data yet
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell key={d.category} fill={getCategoryColor(d.category)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, n) => [
              formatCurrency(Number(v), currency),
              prettyEnum(String(n)),
            ]}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
