import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { financeAccountSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = financeAccountSchema.partial().safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const existing = await prisma.financeAccount.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return fail("Not found", 404);

  const account = await prisma.financeAccount.update({
    where: { id: params.id },
    data: parsed.data,
  });

  revalidatePath("/", "layout");
  return ok({ account });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireUser();
  if (error) return error;

  const existing = await prisma.financeAccount.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return fail("Not found", 404);

  await prisma.financeAccount.delete({ where: { id: params.id } });

  revalidatePath("/", "layout");
  return ok({ ok: true });
}

