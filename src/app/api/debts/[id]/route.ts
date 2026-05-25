import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { debtSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";
import type { DebtType, DebtStatus } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = debtSchema.partial().safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const existing = await prisma.debt.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return fail("Not found", 404);

  const debt = await prisma.$transaction(async (tx) => {
    // Revert old account balance if it existed and was pending
    if (existing.financeAccountId && existing.status === "PENDING") {
      if (existing.type === "GIVEN") {
        await tx.financeAccount.update({
          where: { id: existing.financeAccountId, userId: user.id },
          data: { balance: { increment: existing.amount } },
        });
      } else {
        await tx.financeAccount.update({
          where: { id: existing.financeAccountId, userId: user.id },
          data: { balance: { decrement: existing.amount } },
        });
      }
    }

    const updated = await tx.debt.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.personName !== undefined && { personName: parsed.data.personName }),
        ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
        ...(parsed.data.type !== undefined && { type: parsed.data.type as DebtType }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status as DebtStatus }),
        ...(parsed.data.dueDate !== undefined && { dueDate: parsed.data.dueDate }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes || null }),
        ...(parsed.data.financeAccountId !== undefined && {
          financeAccountId: parsed.data.financeAccountId || null,
        }),
      },
    });

    // Apply new balance if account exists and status is pending
    if (updated.financeAccountId && updated.status === "PENDING") {
      if (updated.type === "GIVEN") {
        await tx.financeAccount.update({
          where: { id: updated.financeAccountId, userId: user.id },
          data: { balance: { decrement: updated.amount } },
        });
      } else {
        await tx.financeAccount.update({
          where: { id: updated.financeAccountId, userId: user.id },
          data: { balance: { increment: updated.amount } },
        });
      }
    }

    return updated;
  });

  return ok({ debt });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireUser();
  if (error) return error;

  const existing = await prisma.debt.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return fail("Not found", 404);

  await prisma.$transaction(async (tx) => {
    if (existing.financeAccountId && existing.status === "PENDING") {
      if (existing.type === "GIVEN") {
        await tx.financeAccount.update({
          where: { id: existing.financeAccountId, userId: user.id },
          data: { balance: { increment: existing.amount } },
        });
      } else {
        await tx.financeAccount.update({
          where: { id: existing.financeAccountId, userId: user.id },
          data: { balance: { decrement: existing.amount } },
        });
      }
    }
    await tx.debt.delete({ where: { id: params.id } });
  });

  return ok({ ok: true });
}
