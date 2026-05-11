import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";
import type { ExpenseCategory, PaymentMethod, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const search = searchParams.get("q");
  const limit = Number(searchParams.get("limit") ?? "200");

  const where: Prisma.ExpenseWhereInput = { userId: user.id };
  if (from || to) {
    where.date = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
  }
  if (category) where.category = category as ExpenseCategory;
  if (search) {
    where.OR = [
      { notes: { contains: search, mode: "insensitive" } },
      { merchant: { contains: search, mode: "insensitive" } },
    ];
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: Math.min(limit, 500),
  });

  return ok({ expenses });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      amount: parsed.data.amount,
      category: parsed.data.category as ExpenseCategory,
      paymentMethod: parsed.data.paymentMethod as PaymentMethod,
      date: parsed.data.date,
      notes: parsed.data.notes || null,
      merchant: parsed.data.merchant || null,
    },
  });
  return ok({ expense }, { status: 201 });
}
