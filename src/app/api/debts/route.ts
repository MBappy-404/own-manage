import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { debtSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";
import type { DebtType, DebtStatus } from "@prisma/client";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return ok({ debts });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = debtSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const { personName, amount, type, dueDate, status, notes, financeAccountId } = parsed.data;

  const debt = await prisma.$transaction(async (tx) => {
    const newDebt = await tx.debt.create({
      data: {
        userId: user.id,
        personName,
        amount,
        type: type as DebtType,
        status: status as DebtStatus,
        dueDate,
        notes: notes || null,
        financeAccountId: financeAccountId || null,
      },
    });

    if (financeAccountId && status === "PENDING") {
      if (type === "GIVEN") {
        await tx.financeAccount.update({
          where: { id: financeAccountId, userId: user.id },
          data: { balance: { decrement: amount } },
        });
      } else {
        await tx.financeAccount.update({
          where: { id: financeAccountId, userId: user.id },
          data: { balance: { increment: amount } },
        });
      }
    }

    return newDebt;
  });

  return ok({ debt }, { status: 201 });
}
