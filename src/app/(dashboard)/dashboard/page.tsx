import Link from "next/link";
import * as React from "react";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import {
  bestEarningMonth,
  categoryBreakdown,
  filterByInterval,
  financialHealthScore,
  highestSpendingDay,
  periodInterval,
  sumAmount,
} from "@/lib/analytics";
import { generateInsights } from "@/lib/insights";
import { formatCurrency, formatDate, percentChange } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { HealthScoreCard } from "@/components/dashboard/health-score";
import { InsightsList } from "@/components/dashboard/insights-list";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { CategoryPie } from "@/components/charts/category-pie";
import { SimpleBar } from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "./dashboard-header";
import { IncomeExpenseChart } from "./income-expense-chart";
import { CurrencyValue } from "@/components/ui/currency-value";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null; // Layout will handle redirect
  }

  const userId = session.user.id;
  const currency = session.user.currency || "USD";
  const { t, locale } = getServerT();

  const [incomes, expenses, user, financeAccounts] = await Promise.all([
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
    prisma.financeAccount.findMany({
      where: { userId },
      orderBy: { balance: "desc" },
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
  const totalWalletBalance = financeAccounts.reduce((acc, curr) => acc + curr.balance, 0);
  const totalUSD = financeAccounts
    .filter((acc) => ["USD", "USDT"].includes(acc.currency.toUpperCase()))
    .reduce((acc, curr) => acc + curr.balance, 0);

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
      date: i.date.toISOString(),
    })),
    ...expenses.slice(0, 4).map((e) => ({
      id: e.id,
      type: "EXPENSE" as const,
      amount: e.amount,
      label: e.merchant ?? e.notes ?? t(`category.${e.category}`),
      category: e.category,
      date: e.date.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const insights = generateInsights({
    incomes,
    expenses,
    monthlyBudget: user?.monthlyBudget,
    t,
  });

  const dayOfWeekBars = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totals = days.map((d) => ({ day: d, total: 0 }));
    for (const e of monthExpenses) {
      totals[new Date(e.date).getDay()].total += e.amount;
    }
    return totals;
  })();

  const serializedIncomes = incomes.map((i) => ({ amount: i.amount, date: i.date.toISOString() }));
  const serializedExpenses = expenses.map((e) => ({ amount: e.amount, date: e.date.toISOString() }));

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
        <DashboardHeader
          incomeLabel={t("nav.income")}
          expenseLabel={t("nav.expenses")}
        />
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          label={t("dashboard.totalBalance")}
          value={totalWalletBalance > 0 ? totalWalletBalance : balance}
          currency={currency}
          icon="Wallet"
          variant="primary"
          delay={0}
        />
        {totalUSD > 0 && (
          <StatCard
            label="Total USD"
            value={totalUSD}
            currency="USD"
            icon="DollarSign"
            variant="premium"
            delay={0.05}
          />
        )}
        <StatCard
          label={t("dashboard.incomeThisMonth")}
          value={monthInc}
          currency={currency}
          icon="TrendingUp"
          variant="success"
          trend={percentChange(monthInc, lastInc)}
          delay={0.1}
        />
        <StatCard
          label={t("dashboard.expenseThisMonth")}
          value={monthExp}
          currency={currency}
          icon="TrendingDown"
          variant="destructive"
          trend={percentChange(monthExp, lastExp)}
          delay={0.15}
        />
        <StatCard
          label={t("dashboard.savingsThisMonth")}
          value={monthSavings}
          currency={currency}
          icon="Sparkles"
          variant={monthSavings >= 0 ? "success" : "warning"}
          hint={monthInc > 0 ? t("dashboard.savingsRate", { rate: Math.round((monthSavings / monthInc) * 100) }) : undefined}
          delay={0.2}
        />
      </section>

      {financeAccounts.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
          <Card className="border-none bg-gradient-to-br from-primary/10 via-background to-background shadow-sm overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg md:text-xl font-bold">
                  {t("accounts.title")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Your current balances across all wallets
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/accounts">{t("common.viewAll")} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {financeAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex flex-col p-3 rounded-2xl bg-background/50 border border-border/50 min-w-[140px] flex-1 hover:bg-background/80 transition-colors group"
                  >
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider group-hover:text-primary transition-colors">
                      {acc.name}
                    </span>
                    <span className="text-lg font-bold mt-1 tracking-tight">
                      <CurrencyValue value={acc.balance} currency={acc.currency} />
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <IncomeExpenseChart
          incomes={serializedIncomes}
          expenses={serializedExpenses}
          title={t("dashboard.incomeVsExpense")}
        />
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
                  <span className="text-muted-foreground">{t(`category.${c.category}`)}</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(c.total, currency, locale)}
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
              primary={peakDay ? <CurrencyValue value={peakDay.total} currency={currency} /> : "—"}
              secondary={peakDay ? formatDate(peakDay.date) : "—"}
            />
            <Highlight
              label={t("dashboard.bestEarningMonth")}
              primary={bestMonth ? <CurrencyValue value={bestMonth.total} currency={currency} /> : "—"}
              secondary={bestMonth?.month ?? "—"}
            />
            <Highlight
              label={t("dashboard.lifetimeIncome")}
              primary={<CurrencyValue value={totalIncome} currency={currency} />}
            />
            <Highlight
              label={t("dashboard.lifetimeExpense")}
              primary={<CurrencyValue value={totalExpense} currency={currency} />}
            />
            {session.user.email === "sadikulsad0810@gmail.com" && (
              <Button asChild variant="ghost" size="sm" className="w-full mt-1">
                <Link href="/leaderboard">
                  <Trophy className="w-4 h-4" /> {t("dashboard.openLeaderboard")}
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> {t("dashboard.smartInsights")}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("dashboard.smartInsightsSubtitle")}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/insights">{t("common.viewAll")} <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <InsightsList insights={insights.slice(0, 6)} />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-1 gap-4">
        <RecentTransactions items={recentTransactions} currency={currency} />
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
  primary: React.ReactNode;
  secondary?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </p>
      <div className="font-semibold mt-0.5">{primary}</div>
      {secondary && <p className="text-xs text-muted-foreground">{secondary}</p>}
    </div>
  );
}
