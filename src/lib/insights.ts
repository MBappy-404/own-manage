import { subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subWeeks } from "date-fns";
type IncomeLike = { amount: number; date: Date | string };
type ExpenseLike = { amount: number; date: Date | string; category: string };
import {
  filterByInterval,
  sumAmount,
  categoryBreakdown,
  spendingByDayOfWeek,
  highestSpendingDay,
} from "./analytics";

export type Insight = {
  id: string;
  title: string;
  message: string;
  tone: "positive" | "neutral" | "warning" | "danger";
  icon?: string;
};

/**
 * Rule-based insight engine that analyses the user's recent financial behavior
 * and produces friendly, actionable suggestions.
 */
export function generateInsights(args: {
  incomes: IncomeLike[];
  expenses: ExpenseLike[];
  monthlyBudget?: number | null;
}): Insight[] {
  const { incomes, expenses, monthlyBudget } = args;
  const insights: Insight[] = [];
  const now = new Date();

  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const lastMonth = {
    start: startOfMonth(subMonths(now, 1)),
    end: endOfMonth(subMonths(now, 1)),
  };
  const thisWeek = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  const lastWeek = {
    start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
    end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
  };

  const expThis = filterByInterval(expenses, thisMonth.start, thisMonth.end);
  const expLast = filterByInterval(expenses, lastMonth.start, lastMonth.end);
  const incThis = filterByInterval(incomes, thisMonth.start, thisMonth.end);
  const incLast = filterByInterval(incomes, lastMonth.start, lastMonth.end);

  const sumExpThis = sumAmount(expThis);
  const sumExpLast = sumAmount(expLast);
  const sumIncThis = sumAmount(incThis);
  const sumIncLast = sumAmount(incLast);

  // Spending higher than last month
  if (sumExpLast > 0) {
    const diffPct = ((sumExpThis - sumExpLast) / sumExpLast) * 100;
    if (diffPct >= 15) {
      insights.push({
        id: "spend-up",
        title: "Spending is up this month",
        message: `Your spending this month is ${Math.round(diffPct)}% higher than last month.`,
        tone: "warning",
        icon: "TrendingUp",
      });
    } else if (diffPct <= -15) {
      insights.push({
        id: "spend-down",
        title: "Great progress on spending",
        message: `You spent ${Math.round(Math.abs(diffPct))}% less than last month. Keep it up!`,
        tone: "positive",
        icon: "TrendingDown",
      });
    }
  }

  // Income dropped
  if (sumIncLast > 0) {
    const diffPct = ((sumIncThis - sumIncLast) / sumIncLast) * 100;
    if (diffPct <= -15) {
      insights.push({
        id: "income-drop",
        title: "Income dropped this month",
        message: `Your income is down ${Math.round(Math.abs(diffPct))}% compared to last month.`,
        tone: "danger",
        icon: "ArrowDownRight",
      });
    } else if (diffPct >= 15) {
      insights.push({
        id: "income-up",
        title: "Income increased",
        message: `Your income is up ${Math.round(diffPct)}% vs last month. Strong work!`,
        tone: "positive",
        icon: "ArrowUpRight",
      });
    }
  }

  // Savings
  if (sumIncThis > 0) {
    const savings = sumIncThis - sumExpThis;
    const rate = (savings / sumIncThis) * 100;
    if (rate >= 30) {
      insights.push({
        id: "savings-strong",
        title: "Strong savings rate",
        message: `You saved ${Math.round(rate)}% of your income this month. Excellent!`,
        tone: "positive",
        icon: "PiggyBank",
      });
    } else if (rate < 0) {
      insights.push({
        id: "savings-negative",
        title: "Spending more than earning",
        message:
          "Your expenses are higher than income this month. Consider tightening discretionary spending.",
        tone: "danger",
        icon: "AlertTriangle",
      });
    } else if (rate < 10) {
      insights.push({
        id: "savings-low",
        title: "Low savings rate",
        message: `You're only saving ${Math.round(rate)}% this month. Aim for 20%+ if possible.`,
        tone: "warning",
        icon: "Wallet",
      });
    }
  }

  // Biggest expense category
  const breakdown = categoryBreakdown(expThis);
  if (breakdown.length && sumExpThis > 0) {
    const top = breakdown[0];
    const sharePct = (top.total / sumExpThis) * 100;
    if (sharePct >= 30) {
      insights.push({
        id: "top-category",
        title: `${prettyCat(top.category)} is your biggest expense`,
        message: `${prettyCat(top.category)} accounts for ${Math.round(sharePct)}% of your spending this month.`,
        tone: "neutral",
        icon: "PieChart",
      });
    }
  }

  // Weekly food blow-up
  const expFoodThisWeek = expenses.filter(
    (e) =>
      e.category === "FOOD" &&
      new Date(e.date) >= thisWeek.start &&
      new Date(e.date) <= thisWeek.end,
  );
  const expFoodLastWeek = expenses.filter(
    (e) =>
      e.category === "FOOD" &&
      new Date(e.date) >= lastWeek.start &&
      new Date(e.date) <= lastWeek.end,
  );
  const sFoodThis = sumAmount(expFoodThisWeek);
  const sFoodLast = sumAmount(expFoodLastWeek);
  if (sFoodLast > 0 && sFoodThis > sFoodLast * 1.5 && sFoodThis > 0) {
    insights.push({
      id: "food-spike",
      title: "Food spending spike",
      message: `You've spent significantly more on food this week than last week.`,
      tone: "warning",
      icon: "Utensils",
    });
  }

  // Highest spending day of week
  const byDay = spendingByDayOfWeek(expThis);
  const sorted = [...byDay].sort((a, b) => b.total - a.total);
  if (sorted[0] && sorted[0].total > 0) {
    insights.push({
      id: "top-day",
      title: `${sorted[0].day} is your top spending day`,
      message: `You tend to spend the most on ${sorted[0].day}s. Watch out for impulse purchases.`,
      tone: "neutral",
      icon: "Calendar",
    });
  }

  // Highest single day
  const peak = highestSpendingDay(expThis);
  if (peak && peak.total > 0) {
    const avg = sumExpThis / Math.max(expThis.length, 1);
    if (peak.total >= avg * 3 && expThis.length > 5) {
      insights.push({
        id: "outlier-day",
        title: "Outlier spending day",
        message: `You had an unusually high spend on ${peak.date}.`,
        tone: "neutral",
        icon: "Flame",
      });
    }
  }

  // Budget alert
  if (monthlyBudget && monthlyBudget > 0) {
    const ratio = sumExpThis / monthlyBudget;
    if (ratio >= 1) {
      insights.push({
        id: "budget-over",
        title: "Over budget!",
        message: `You're ${Math.round((ratio - 1) * 100)}% over your monthly budget.`,
        tone: "danger",
        icon: "AlertCircle",
      });
    } else if (ratio >= 0.8) {
      insights.push({
        id: "budget-near",
        title: "Approaching budget limit",
        message: `You've used ${Math.round(ratio * 100)}% of your monthly budget.`,
        tone: "warning",
        icon: "AlertTriangle",
      });
    } else if (ratio > 0 && ratio <= 0.5) {
      insights.push({
        id: "budget-healthy",
        title: "Budget on track",
        message: `Only ${Math.round(ratio * 100)}% of your monthly budget used so far.`,
        tone: "positive",
        icon: "ShieldCheck",
      });
    }
  }

  // Healthy balance
  if (
    sumIncThis > 0 &&
    sumExpThis > 0 &&
    sumIncThis - sumExpThis > 0 &&
    insights.length < 6
  ) {
    insights.push({
      id: "healthy",
      title: "Healthy financial balance",
      message: "Your income comfortably covers expenses this month.",
      tone: "positive",
      icon: "Sparkles",
    });
  }

  // Dangerous expense ratio
  if (sumIncThis > 0 && sumExpThis / sumIncThis >= 0.95) {
    insights.push({
      id: "danger-ratio",
      title: "Expense ratio dangerously high",
      message: "You're spending nearly all of what you earn. Time to plan some savings.",
      tone: "danger",
      icon: "Siren",
    });
  }

  return insights.slice(0, 8);
}

function prettyCat(c: string) {
  return c.charAt(0) + c.slice(1).toLowerCase();
}
