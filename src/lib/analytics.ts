import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  format,
  isWithinInterval,
  differenceInDays,
} from "date-fns";

type DateLike = Date | string;
type IncomeLike = { amount: number; date: DateLike };
type ExpenseLike = { amount: number; date: DateLike; category: string };

export type Period = "day" | "week" | "month" | "year" | "all";

export function periodInterval(period: Period, ref: Date = new Date()): { start: Date; end: Date } {
  switch (period) {
    case "day":
      return { start: startOfDay(ref), end: endOfDay(ref) };
    case "week":
      return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
    case "year":
      return { start: startOfYear(ref), end: endOfYear(ref) };
    case "all":
    default:
      return { start: new Date(0), end: new Date(8640000000000000) };
  }
}

export function sumAmount<T extends { amount: number }>(items: T[]): number {
  return items.reduce((acc, x) => acc + (x.amount || 0), 0);
}

export function filterByInterval<T extends { date: DateLike }>(
  items: T[],
  start: Date,
  end: Date
): T[] {
  return items.filter((x) =>
    isWithinInterval(new Date(x.date), { start, end })
  );
}

export function buildDailySeries(items: { amount: number; date: DateLike }[], days = 30) {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(end, days - 1));
  return buildDailySeriesInInterval(items, start, end);
}

export function buildDailySeriesInInterval(
  items: { amount: number; date: DateLike }[],
  start: Date,
  end: Date,
) {
  const rangeStart = startOfDay(start);
  const rangeEnd = endOfDay(end);
  if (rangeStart > rangeEnd) return [];
  const buckets = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((d) => ({
    date: format(d, "yyyy-MM-dd"),
    label: format(d, "d MMM"),
    total: 0,
  }));
  for (const it of items) {
    const key = format(new Date(it.date), "yyyy-MM-dd");
    const b = buckets.find((x) => x.date === key);
    if (b) b.total += it.amount;
  }
  return buckets;
}

/** Day-by-day totals from the 1st through today in the given month. */
export function buildCurrentMonthDailySeries(
  items: { amount: number; date: DateLike }[],
  ref: Date = new Date(),
) {
  return buildDailySeriesInInterval(items, startOfMonth(ref), endOfDay(ref));
}

export function buildMonthlySeries(
  items: { amount: number; date: DateLike }[],
  months = 12,
) {
  const end = endOfMonth(new Date());
  const start = startOfMonth(subMonths(end, months - 1));
  const buckets = eachMonthOfInterval({ start, end }).map((d) => ({
    month: format(d, "yyyy-MM"),
    label: format(d, "MMM"),
    total: 0,
  }));
  for (const it of items) {
    const key = format(new Date(it.date), "yyyy-MM");
    const b = buckets.find((x) => x.month === key);
    if (b) b.total += it.amount;
  }
  return buckets;
}

export function buildMonthlySeriesForYear(
  items: { amount: number; date: DateLike }[],
  year: number
) {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 11, 31));
  const buckets = eachMonthOfInterval({ start, end }).map((d) => ({
    month: format(d, "yyyy-MM"),
    label: format(d, "MMM"),
    total: 0,
  }));
  for (const it of items) {
    const key = format(new Date(it.date), "yyyy-MM");
    const b = buckets.find((x) => x.month === key);
    if (b) b.total += it.amount;
  }
  return buckets;
}

export function buildWeeklySeries(
  items: { amount: number; date: DateLike }[],
  weeks = 12,
) {
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  const start = startOfWeek(subWeeks(end, weeks - 1), { weekStartsOn: 1 });
  const buckets = eachWeekOfInterval(
    { start, end },
    { weekStartsOn: 1 },
  ).map((d) => ({
    week: format(d, "yyyy-'W'II"),
    label: format(d, "MMM d"),
    total: 0,
  }));
  for (const it of items) {
    const key = format(new Date(it.date), "yyyy-'W'II");
    const b = buckets.find((x) => x.week === key);
    if (b) b.total += it.amount;
  }
  return buckets;
}

export function categoryBreakdown(expenses: ExpenseLike[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }
  const arr: { category: string; total: number }[] = [];
  map.forEach((total, category) => arr.push({ category, total }));
  return arr.sort((a, b) => b.total - a.total);
}

export function spendingByDayOfWeek(expenses: ExpenseLike[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = days.map((d) => ({ day: d, total: 0 }));
  for (const e of expenses) {
    const idx = new Date(e.date).getDay();
    totals[idx].total += e.amount;
  }
  return totals;
}

export function highestSpendingDay(expenses: ExpenseLike[]): { date: string; total: number } | null {
  if (!expenses.length) return null;
  const map = new Map<string, number>();
  for (const e of expenses) {
    const key = format(new Date(e.date), "yyyy-MM-dd");
    map.set(key, (map.get(key) ?? 0) + e.amount);
  }
  let max = { date: "", total: -Infinity };
  map.forEach((total, date) => {
    if (total > max.total) max = { date, total };
  });
  return max.total === -Infinity ? null : max;
}

export function lowestSpendingDay(expenses: ExpenseLike[]): { date: string; total: number } | null {
  if (!expenses.length) return null;
  const map = new Map<string, number>();
  for (const e of expenses) {
    const key = format(new Date(e.date), "yyyy-MM-dd");
    map.set(key, (map.get(key) ?? 0) + e.amount);
  }
  let min = { date: "", total: Infinity };
  map.forEach((total, date) => {
    if (total < min.total) min = { date, total };
  });
  return min.total === Infinity ? null : min;
}

export function highestIncomeDay(incomes: IncomeLike[]): { date: string; total: number } | null {
  if (!incomes.length) return null;
  const map = new Map<string, number>();
  for (const i of incomes) {
    const key = format(new Date(i.date), "yyyy-MM-dd");
    map.set(key, (map.get(key) ?? 0) + i.amount);
  }
  let max = { date: "", total: -Infinity };
  map.forEach((total, date) => {
    if (total > max.total) max = { date, total };
  });
  return max.total === -Infinity ? null : max;
}

export function bestEarningMonth(incomes: IncomeLike[]): { month: string; total: number } | null {
  if (!incomes.length) return null;
  const map = new Map<string, number>();
  for (const i of incomes) {
    const key = format(new Date(i.date), "yyyy-MM");
    map.set(key, (map.get(key) ?? 0) + i.amount);
  }
  let max = { month: "", total: -Infinity };
  map.forEach((total, month) => {
    if (total > max.total) max = { month, total };
  });
  return max.total === -Infinity ? null : max;
}

/**
 * Financial Health Score (0-100).
 * Based on savings rate, budget adherence, and spend volatility.
 */
export function financialHealthScore(args: {
  income: number;
  expense: number;
  monthlyBudget?: number | null;
  expenseCount: number;
}): number {
  const { income, expense, monthlyBudget, expenseCount } = args;
  if (income === 0 && expense === 0) return 0;

  const savingsRate = income > 0 ? (income - expense) / income : -1;
  let score = 50 + Math.max(-50, Math.min(50, savingsRate * 100));

  if (monthlyBudget && monthlyBudget > 0) {
    const ratio = expense / monthlyBudget;
    if (ratio <= 0.8) score += 10;
    else if (ratio <= 1) score += 5;
    else if (ratio > 1.2) score -= 10;
  }

  if (expenseCount === 0 && income > 0) score = 100;
  if (income === 0 && expense > 0) score = Math.max(0, score - 25);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function daysActive(items: { date: DateLike }[]): number {
  if (!items.length) return 0;
  const dates = items.map((x) => new Date(x.date).getTime());
  const min = Math.min(...dates);
  const max = Math.max(...dates);
  return Math.max(1, differenceInDays(new Date(max), new Date(min)) + 1);
}

export function buildYearlySeries(
  items: { amount: number; date: DateLike }[],
  years = 5,
) {
  const end = endOfYear(new Date());
  const start = startOfYear(subDays(end, 365 * (years - 1)));
  const buckets = eachYearOfInterval({ start, end }).map((d) => ({
    year: format(d, "yyyy"),
    label: format(d, "yyyy"),
    total: 0,
  }));
  for (const it of items) {
    const key = format(new Date(it.date), "yyyy");
    const b = buckets.find((x) => x.year === key);
    if (b) b.total += it.amount;
  }
  return buckets;
}
