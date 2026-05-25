import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireUser } from "@/lib/api-helpers";

const ADMIN_EMAIL = "sadikulsad0810@gmail.com";

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
    await prisma.feedback.delete({
      where: { id: params.id },
    });
    return ok({ success: true });
  } catch (err) {
    console.error("Feedback deletion error:", err);
    return fail("Failed to delete feedback", 500);
  }
}
