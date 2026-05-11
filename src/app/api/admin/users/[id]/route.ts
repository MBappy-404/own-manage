import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireUser } from "@/lib/api-helpers";

const ADMIN_EMAIL = "sadikulsad0810@gmail.com";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireUser();
  if (error) return error;

  if (user.email !== ADMIN_EMAIL) {
    return fail("Unauthorized", 403);
  }

  try {
    const { name, email, image } = await req.json();
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { name, email, image },
    });
    return ok(updated);
  } catch (err) {
    console.error(err);
    return fail("Failed to update user", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireUser();
  if (error) return error;

  if (user.email !== ADMIN_EMAIL) {
    return fail("Unauthorized", 403);
  }

  try {
    // Delete all related data first or rely on cascade if configured
    // In this app, we have incomes, expenses, etc.
    // Let's check the schema to see if cascade is set up.
    
    await prisma.user.delete({
      where: { id: params.id },
    });
    return ok({ success: true });
  } catch (err) {
    console.error(err);
    return fail("Failed to delete user", 500);
  }
}
