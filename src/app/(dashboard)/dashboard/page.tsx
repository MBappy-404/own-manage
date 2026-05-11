import Link from "next/link";
import { ArrowRight, Plus, Sparkles, Trophy, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import {
  bestEarningMonth,
  buildMonthlySeries,
  categoryBreakdown,
  filterByInterval,
  financialHealthScore,
  highestSpendingDay,
  periodInterval,
  sumAmount,
} from "@/lib/analytics";
import { generateInsights } from "@/lib/insights";
import { formatCurrency, formatDate, prettyEnum, percentChange } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { HealthScoreCard } from "@/components/dashboard/health-score";
import { InsightsList } from "@/components/dashboard/insights-list";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { IncomeExpenseArea } from "@/components/charts/area-chart";
import { CategoryPie } from "@/components/charts/category-pie";
import { SimpleBar } from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;
  const currency = session.user.currency || "USD";
  const { t, locale } = getServerT();

  const [incomes, expenses, user] = await Promise.all([
    prisma.income.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, monthlyBudget: true },
    }),
  ]);

  const now = new Date();
  const month = periodInterval("month", now);
  const lastMonth = periodInterval("month", new Date(now.getFullYear(), now.getMonth() - 1, 15));

  const monthIncomes = filterByInterval(incomes, month.start, month.end);
  const monthExpenses = filterByInterval(expenses, month.start, month.end);
  const lastMonthIncomes = filterByInterval(incomes, lastMonth.start, lastMonth.end);
  const lastMonthExpenses = filterByInterval(expenses, lastMonth.start, lastMonth.end);

  const totalIncome = sumAmount(incomes);
  const totalExpense = sumAmount(expenses);
  const balance = totalIncome - totalExpense;

  const monthInc = sumAmount(monthIncomes);
  const monthExp = sumAmount(monthExpenses);
  const monthSavings = monthInc - monthExp;
  const lastInc = sumAmount(lastMonthIncomes);
  const lastExp = sumAmount(lastMonthExpenses);

  const score = financialHealthScore({
    income: monthInc,
    expense: monthExp,
    monthlyBudget: user?.monthlyBudget,
    expenseCount: monthExpenses.length,
  });

  const monthlyIncomeSeries = buildMonthlySeries(incomes, 8);
  const monthlyExpenseSeries = buildMonthlySeries(expenses, 8);
  const breakdown = categoryBreakdown(monthExpenses);
  const peakDay = highestSpendingDay(expenses);
  const bestMonth = bestEarningMonth(incomes);

  const recentTransactions = [
    ...incomes.slice(0, 4).map((i) => ({
      id: i.id,
      type: "INCOME" as const,
      amount: i.amount,
      label: i.source,
      category: i.category,
      date: i.date,
    })),
    ...expenses.slice(0, 4).map((e) => ({
      id: e.id,
      type: "EXPENSE" as const,
      amount: e.amount,
      label: e.merchant ?? e.notes ?? prettyEnum(e.category),
      category: e.category,
      date: e.date,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const insights = generateInsights({
    incomes,
    expenses,
    monthlyBudget: user?.monthlyBudget,
  });

  const dayOfWeekBars = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totals = days.map((d) => ({ day: d, total: 0 }));
    for (const e of monthExpenses) {
      totals[new Date(e.date).getDay()].total += e.amount;
    }
    return totals;
  })();

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {new Date().toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("dashboard.greeting", { name: user?.name?.split(" ")[0] ?? "" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/income">
              <Plus className="w-4 h-4" /> {t("nav.income")}
            </Link>
          </Button>
          <Button asChild variant="premium" size="sm">
            <Link href="/expenses">
              <Plus className="w-4 h-4" /> {t("nav.expenses")}
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label={t("dashboard.totalBalance")}
          value={balance}
          currency={currency}
          icon={Wallet}
          variant="primary"
          delay={0}
        />
        <StatCard
          label={t("dashboard.incomeThisMonth")}
          value={monthInc}
          currency={currency}
          icon={TrendingUp}
          variant="success"
          trend={percentChange(monthInc, lastInc)}
          delay={0.05}
        />
        <StatCard
          label={t("dashboard.expenseThisMonth")}
          value={monthExp}
          currency={currency}
          icon={TrendingDown}
          variant="destructive"
          trend={percentChange(monthExp, lastExp)}
          delay={0.1}
        />
        <StatCard
          label={t("dashboard.savingsThisMonth")}
          value={monthSavings}
          currency={currency}
          icon={Sparkles}
          variant={monthSavings >= 0 ? "success" : "warning"}
          hint={monthInc > 0 ? t("dashboard.savingsRate", { rate: Math.round((monthSavings / monthInc) * 100) }) : undefined}
          delay={0.15}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("dashboard.incomeVsExpense")}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.lastMonths", { n: 8 })}</p>
            </div>
          </CardHeader>
          <CardContent>
            <IncomeExpenseArea
              income={monthlyIncomeSeries}
              expense={monthlyExpenseSeries}
            />
          </CardContent>
        </Card>
        <HealthScoreCard score={score} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("dashboard.byCategory")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("common.thisMonth")}</p>
          </CardHeader>
          <CardContent className="pt-2">
            <CategoryPie data={breakdown} currency={currency} />
            <div className="mt-3 space-y-1.5">
              {breakdown.slice(0, 4).map((c) => (
                <div key={c.category} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{prettyEnum(c.category)}</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(c.total, currency)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("dashboard.byDayOfWeek")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("common.thisMonth")}</p>
          </CardHeader>
          <CardContent className="pt-2">
            <SimpleBar
              data={dayOfWeekBars}
              dataKey="total"
              color="hsl(var(--primary))"
            />
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>{t("dashboard.quickHighlights")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("dashboard.personalRecords")}</p>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            <Highlight
              label={t("dashboard.highestSpendDay")}
              primary={peakDay ? formatCurrency(peakDay.total, currency) : "—"}
              secondary={peakDay ? formatDate(peakDay.date) : "—"}
            />
            <Highlight
              label={t("dashboard.bestEarningMonth")}
              primary={bestMonth ? formatCurrency(bestMonth.total, currency) : "—"}
              secondary={bestMonth?.month ?? "—"}
            />
            <Highlight
              label={t("dashboard.lifetimeIncome")}
              primary={formatCurrency(totalIncome, currency)}
            />
            <Highlight
              label={t("dashboard.lifetimeExpense")}
              primary={formatCurrency(totalExpense, currency)}
            />
            <Button asChild variant="ghost" size="sm" className="w-full mt-1">
              <Link href="/leaderboard">
                <Trophy className="w-4 h-4" /> {t("dashboard.openLeaderboard")}
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("dashboard.smartInsights")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("dashboard.smartInsightsSubtitle")}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/insights">{t("common.viewAll")} <ArrowRight className="w-3.5 h-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <InsightsList insights={insights.slice(0, 4)} />
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-2">
          <RecentTransactions items={recentTransactions} currency={currency} />
        </div>
      </section>
    </div>
  );
}

function Highlight({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </p>
      <p className="font-semibold mt-0.5">{primary}</p>
      {secondary && <p className="text-xs text-muted-foreground">{secondary}</p>}
    </div>
  );
}
