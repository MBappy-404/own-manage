import { Brain } from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { generateInsights } from "@/lib/insights";
import {
  bestEarningMonth,
  buildMonthlySeries,
  categoryBreakdown,
  filterByInterval,
  highestSpendingDay,
  lowestSpendingDay,
  periodInterval,
  sumAmount,
} from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightsList } from "@/components/dashboard/insights-list";
import { IncomeExpenseArea } from "@/components/charts/area-chart";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "AI Insights" };

export default async function InsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = session.user.id;
  const currency = session.user.currency || "USD";
  const { t } = getServerT();

  const [incomes, expenses, profile] = await Promise.all([
    prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyBudget: true },
    }),
  ]);

  const insights = generateInsights({
    incomes,
    expenses,
    monthlyBudget: profile?.monthlyBudget,
  });

  const month = periodInterval("month");
  const monthExp = filterByInterval(expenses, month.start, month.end);
  const monthInc = filterByInterval(incomes, month.start, month.end);
  const top = categoryBreakdown(monthExp)[0];
  const peak = highestSpendingDay(expenses);
  const low = lowestSpendingDay(expenses);
  const best = bestEarningMonth(incomes);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">
          <Brain className="w-4 h-4 text-primary" /> {t("insights.engineLabel")}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
          {t("insights.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("insights.subtitle")}</p>
      </header>

      <section>
        <InsightsList insights={insights} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>{t("insights.flow")}</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseArea
              income={buildMonthlySeries(incomes, 12)}
              expense={buildMonthlySeries(expenses, 12)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t("insights.signals")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label={t("insights.topCategory")}
              value={top ? `${top.category} (${formatCurrency(top.total, currency)})` : "—"}
            />
            <Row
              label={t("insights.bestMonth")}
              value={best ? `${best.month} (${formatCurrency(best.total, currency)})` : "—"}
            />
            <Row
              label={t("insights.peakDay")}
              value={peak ? `${peak.date} (${formatCurrency(peak.total, currency)})` : "—"}
            />
            <Row
              label={t("insights.lowDay")}
              value={low ? `${low.date} (${formatCurrency(low.total, currency)})` : "—"}
            />
            <Row
              label={t("insights.monthIncome")}
              value={formatCurrency(sumAmount(monthInc), currency)}
            />
            <Row
              label={t("insights.monthExpense")}
              value={formatCurrency(sumAmount(monthExp), currency)}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className="font-semibold text-right truncate">{value}</span>
    </div>
  );
}
