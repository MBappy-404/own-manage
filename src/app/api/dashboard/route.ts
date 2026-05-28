import { prisma } from "@/lib/prisma";
import {
  bestEarningMonth,
  buildDailySeries,
  buildMonthlySeries,
  buildWeeklySeries,
  categoryBreakdown,
  filterByInterval,
  financialHealthScore,
  highestIncomeDay,
  highestSpendingDay,
  lowestSpendingDay,
  periodInterval,
  spendingByDayOfWeek,
  sumAmount,
} from "@/lib/analytics";
import { generateInsights } from "@/lib/insights";
import { getServerT } from "@/lib/i18n/server";
import { ok, requireUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  const [incomes, expenses, profile, goals] = await Promise.all([
    prisma.income.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.expense.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, currency: true, monthlyBudget: true, image: true, email: true },
    }),
    prisma.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const now = new Date();
  const day = periodInterval("day", now);
  const week = periodInterval("week", now);
  const month = periodInterval("month", now);
  const year = periodInterval("year", now);

  const totalIncome = sumAmount(incomes);
  const totalExpense = sumAmount(expenses);
  const balance = totalIncome - totalExpense;

  const monthIncome = sumAmount(filterByInterval(incomes, month.start, month.end));
  const monthExpense = sumAmount(filterByInterval(expenses, month.start, month.end));
  const weekIncome = sumAmount(filterByInterval(incomes, week.start, week.end));
  const weekExpense = sumAmount(filterByInterval(expenses, week.start, week.end));
  const dayIncome = sumAmount(filterByInterval(incomes, day.start, day.end));
  const dayExpense = sumAmount(filterByInterval(expenses, day.start, day.end));
  const yearIncome = sumAmount(filterByInterval(incomes, year.start, year.end));
  const yearExpense = sumAmount(filterByInterval(expenses, year.start, year.end));

  const healthScore = financialHealthScore({
    income: monthIncome,
    expense: monthExpense,
    monthlyBudget: profile?.monthlyBudget,
    expenseCount: filterByInterval(expenses, month.start, month.end).length,
  });

  const { t } = getServerT();

  const insights = generateInsights({
    incomes,
    expenses,
    monthlyBudget: profile?.monthlyBudget,
    t,
  });

  const recentTransactions = [
    ...incomes.slice(0, 5).map((i) => ({
      id: i.id,
      type: "INCOME" as const,
      amount: i.amount,
      label: i.source,
      category: i.category,
      date: i.date,
    })),
    ...expenses.slice(0, 5).map((e) => ({
      id: e.id,
      type: "EXPENSE" as const,
      amount: e.amount,
      label: e.merchant ?? e.notes ?? "Expense",
      category: e.category,
      date: e.date,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return ok({
    user: profile,
    summary: {
      totalIncome,
      totalExpense,
      balance,
      monthIncome,
      monthExpense,
      weekIncome,
      weekExpense,
      dayIncome,
      dayExpense,
      yearIncome,
      yearExpense,
      savings: monthIncome - monthExpense,
      healthScore,
    },
    series: {
      dailyExpense: buildDailySeries(expenses, 30),
      dailyIncome: buildDailySeries(incomes, 30),
      monthlyExpense: buildMonthlySeries(expenses, 12),
      monthlyIncome: buildMonthlySeries(incomes, 12),
      weeklyExpense: buildWeeklySeries(expenses, 8),
      weeklyIncome: buildWeeklySeries(incomes, 8),
    },
    breakdown: categoryBreakdown(filterByInterval(expenses, month.start, month.end)),
    dayOfWeek: spendingByDayOfWeek(filterByInterval(expenses, month.start, month.end)),
    highlights: {
      highestSpendingDay: highestSpendingDay(expenses),
      lowestSpendingDay: lowestSpendingDay(expenses),
      highestIncomeDay: highestIncomeDay(incomes),
      bestEarningMonth: bestEarningMonth(incomes),
    },
    insights,
    recentTransactions,
    goals,
  });
}
