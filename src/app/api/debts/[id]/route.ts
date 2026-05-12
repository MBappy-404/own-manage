import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { debtSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";

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

  const debt = await prisma.debt.update({
    where: { id: params.id },
    data: parsed.data,
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

  await prisma.debt.delete({ where: { id: params.id } });
  return ok({ ok: true });
}
