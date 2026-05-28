import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { savingsGoalSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return ok({ goals });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = savingsGoalSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const goal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      targetAmount: parsed.data.targetAmount,
      currentAmount: parsed.data.currentAmount ?? 0,
      deadline: parsed.data.deadline ?? null,
      description: parsed.data.description || null,
    },
  });

  revalidatePath("/", "layout");
  return ok({ goal }, { status: 201 });
}

