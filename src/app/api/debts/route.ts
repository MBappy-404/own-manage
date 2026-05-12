import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { debtSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";

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

  const debt = await prisma.debt.create({
    data: {
      ...parsed.data,
      userId: user.id,
    },
  });

  return ok({ debt });
}
