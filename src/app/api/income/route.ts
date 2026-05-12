import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { incomeSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Number(searchParams.get("limit") ?? "200");

  const incomes = await prisma.income.findMany({
    where: {
      userId: user.id,
      ...(from || to
        ? {
            date: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
    take: Math.min(limit, 500),
  });

  return ok({ incomes });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = incomeSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const { amount, source, category, frequency, date, notes, financeAccountId } = parsed.data;

  // Use a transaction to create the income and update account balance
  const income = await prisma.$transaction(async (tx) => {
    const newIncome = await tx.income.create({
      data: {
        userId: user.id,
        amount,
        source,
        category,
        frequency,
        date,
        notes: notes || null,
        financeAccountId: financeAccountId || null,
      },
    });

    if (financeAccountId) {
      await tx.financeAccount.update({
        where: { id: financeAccountId, userId: user.id },
        data: { balance: { increment: amount } },
      });
    }

    return newIncome;
  });

  return ok({ income }, { status: 201 });
}
