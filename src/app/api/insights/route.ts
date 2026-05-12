import { prisma } from "@/lib/prisma";
import { generateInsights } from "@/lib/insights";
import { getServerT } from "@/lib/i18n/server";
import { ok, requireUser } from "@/lib/api-helpers";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  const [incomes, expenses, profile] = await Promise.all([
    prisma.income.findMany({ where: { userId: user.id } }),
    prisma.expense.findMany({ where: { userId: user.id } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { monthlyBudget: true },
    }),
  ]);

  const { t } = getServerT();

  const insights = generateInsights({
    incomes,
    expenses,
    monthlyBudget: profile?.monthlyBudget,
    t,
  });

  return ok({ insights });
}
