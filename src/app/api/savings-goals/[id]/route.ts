import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { savingsGoalSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = savingsGoalSchema.partial().safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const existing = await prisma.savingsGoal.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return fail("Not found", 404);

  const goal = await prisma.savingsGoal.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.targetAmount !== undefined && {
        targetAmount: parsed.data.targetAmount,
      }),
      ...(parsed.data.currentAmount !== undefined && {
        currentAmount: parsed.data.currentAmount,
      }),
      ...(parsed.data.deadline !== undefined && { deadline: parsed.data.deadline }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description || null,
      }),
    },
  });

  revalidatePath("/", "layout");
  return ok({ goal });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireUser();
  if (error) return error;

  const existing = await prisma.savingsGoal.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return fail("Not found", 404);

  await prisma.savingsGoal.delete({ where: { id: params.id } });

  revalidatePath("/", "layout");
  return ok({ ok: true });
}

