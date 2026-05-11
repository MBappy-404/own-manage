import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      currency: true,
      monthlyBudget: true,
      image: true,
    },
  });
  return ok({ profile });
}

export async function PUT(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const profile = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      currency: parsed.data.currency,
      monthlyBudget: parsed.data.monthlyBudget ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      currency: true,
      monthlyBudget: true,
    },
  });
  return ok({ profile });
}
