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

  const income = await prisma.income.create({
    data: {
      userId: user.id,
      amount: parsed.data.amount,
      source: parsed.data.source,
      category: parsed.data.category,
      frequency: parsed.data.frequency,
      date: parsed.data.date,
      notes: parsed.data.notes || null,
    },
  });
  return ok({ income }, { status: 201 });
}
