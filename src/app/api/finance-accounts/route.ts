import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { financeAccountSchema } from "@/lib/validations";
import { fail, ok, requireUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  const accounts = await prisma.financeAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return ok({ accounts });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const parsed = financeAccountSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input");

  const account = await prisma.financeAccount.create({
    data: {
      ...parsed.data,
      userId: user.id,
    },
  });

  revalidatePath("/", "layout");
  return ok({ account });
}

