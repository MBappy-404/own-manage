"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getCategoryColor, prettyEnum } from "@/lib/utils";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  label: string;
  category: string;
  date: Date | string;
};

export function RecentTransactions({
  items,
  currency,
}: {
  items: Transaction[];
  currency: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {!items.length ? (
          <p className="text-sm text-muted-foreground px-6 py-4">
            No transactions yet. Start logging income and expenses.
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((t) => {
              const color = t.type === "EXPENSE" ? getCategoryColor(t.category) : "#10b981";
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div
                    className="w-9 h-9 grid place-items-center rounded-lg text-white shrink-0"
                    style={{ background: color }}
                  >
                    {t.type === "INCOME" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {prettyEnum(t.category)} · {formatDate(t.date)}
                    </p>
                  </div>
                  <div
                    className={
                      t.type === "INCOME"
                        ? "text-success font-semibold tabular-nums"
                        : "text-destructive font-semibold tabular-nums"
                    }
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(t.amount, currency)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
