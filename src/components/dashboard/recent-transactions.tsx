"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getCategoryColor } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { CurrencyValue } from "@/components/ui/currency-value";

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
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {!items.length ? (
          <p className="text-sm text-muted-foreground px-6 py-4">
            {t("income.emptyHint")}
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((tx) => {
              const color = tx.type === "EXPENSE" ? getCategoryColor(tx.category) : "#10b981";
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div
                    className="w-9 h-9 grid place-items-center rounded-lg text-white shrink-0"
                    style={{ background: color }}
                  >
                    {tx.type === "INCOME" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.type === "INCOME"
                        ? t(`incomeCategory.${tx.category}`)
                        : t(`category.${tx.category}`)}{" "}
                      · {formatDate(tx.date)}
                    </p>
                  </div>
                  <div
                    className={
                      tx.type === "INCOME"
                        ? "text-success font-semibold tabular-nums"
                        : "text-destructive font-semibold tabular-nums"
                    }
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    <CurrencyValue value={tx.amount} currency={currency} />
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
