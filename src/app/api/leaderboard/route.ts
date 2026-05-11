import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { periodInterval, sumAmount, filterByInterval } from "@/lib/analytics";
import { ok, fail, requireUser } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") ?? "month") as
    | "week"
    | "month"
    | "all";
  const sort = (searchParams.get("sort") ?? "savings") as
    | "savings"
    | "income"
    | "expense";

  if (user.email !== "sadikulsad0810@gmail.com") {
    return fail("Access denied. Only administrators can view the leaderboard.", 403);
  }

  const interval = periodInterval(period, new Date());

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      incomes: { select: { amount: true, date: true } },
      expenses: { select: { amount: true, date: true } },
    },
  });

  const rows = users.map((u) => {
    const inc =
      period === "all"
        ? sumAmount(u.incomes)
        : sumAmount(filterByInterval(u.incomes, interval.start, interval.end));
    const exp =
      period === "all"
        ? sumAmount(u.expenses)
        : sumAmount(filterByInterval(u.expenses, interval.start, interval.end));
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      income: inc,
      expense: exp,
      savings: inc - exp,
    };
  });

  const sorted = rows.sort((a, b) => {
    if (sort === "income") return b.income - a.income;
    if (sort === "expense") return b.expense - a.expense;
    return b.savings - a.savings;
  });

  const ranked = sorted.map((row, idx) => ({
    ...row,
    rank: idx + 1,
    isCurrentUser: row.id === user.id,
  }));

  const currentUserRank = ranked.find((r) => r.isCurrentUser) ?? null;

  return ok({
    period,
    sort,
    leaderboard: ranked.slice(0, 50),
    currentUserRank,
    totalUsers: ranked.length,
  });
}
