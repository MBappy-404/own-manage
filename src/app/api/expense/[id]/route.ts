import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";
import type { PaymentMethod } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = expenseSchema.partial().safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const existing = await prisma.expense.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return fail("Not found", 404);

  const expense = await prisma.$transaction(async (tx) => {
    // Revert old account balance if it existed
    if (existing.financeAccountId) {
      await tx.financeAccount.update({
        where: { id: existing.financeAccountId },
        data: { balance: { increment: existing.amount } },
      });
    }

    const updated = await tx.expense.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
        ...(parsed.data.category !== undefined && {
          category: parsed.data.category,
        }),
        ...(parsed.data.paymentMethod !== undefined && {
          paymentMethod: parsed.data.paymentMethod as PaymentMethod,
        }),
        ...(parsed.data.date !== undefined && { date: parsed.data.date }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes || null }),
        ...(parsed.data.merchant !== undefined && {
          merchant: parsed.data.merchant || null,
        }),
        ...(parsed.data.financeAccountId !== undefined && {
          financeAccountId: parsed.data.financeAccountId || null,
        }),
      },
    });

    // Apply new balance if account exists
    if (updated.financeAccountId) {
      await tx.financeAccount.update({
        where: { id: updated.financeAccountId },
        data: { balance: { decrement: updated.amount } },
      });
    }

    return updated;
  });

  return ok({ expense });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireUser();
  if (error) return error;

  const existing = await prisma.expense.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return fail("Not found", 404);

  await prisma.$transaction(async (tx) => {
    if (existing.financeAccountId) {
      await tx.financeAccount.update({
        where: { id: existing.financeAccountId },
        data: { balance: { increment: existing.amount } },
      });
    }
    await tx.expense.delete({ where: { id: params.id } });
  });

  return ok({ ok: true });
}
