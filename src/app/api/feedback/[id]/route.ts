import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "sadikulsad0810@gmail.com";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const existing = await prisma.feedback.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return fail("Feedback not found", 404);
    }

    const isAdmin = user.email === ADMIN_EMAIL;
    const isOwner = existing.userId === user.id;

    if (!isAdmin && !isOwner) {
      return fail("Unauthorized", 403);
    }

    const { rating, message, status, adminResponse } = await req.json();

    let updated;

    if (isAdmin) {
      updated = await prisma.feedback.update({
        where: { id: params.id },
        data: {
          ...(status !== undefined && { status }),
          ...(adminResponse !== undefined && { adminResponse }),
        },
      });

      // Create notification for the user when marked as resolved
      if (status === "DONE" && existing.status !== "DONE") {
        await prisma.notification.create({
          data: {
            userId: existing.userId,
            title: "Feedback Resolved!",
            message: `Your feedback has been marked as resolved. Reply: "${adminResponse ?? 'Fixed!'}"`,
            type: "SUCCESS",
            read: false,
            feedbackId: existing.id,
          },
        });
      }
    } else {
      if (existing.status !== "PENDING") {
        return fail("Cannot edit feedback that has already been reviewed", 400);
      }

      const rateValue = typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : existing.rating;

      updated = await prisma.feedback.update({
        where: { id: params.id },
        data: {
          ...(message !== undefined && { message }),
          rating: rateValue,
        },
      });
    }

    revalidatePath("/", "layout");
    return ok(updated);
  } catch (err) {
    console.error("Feedback update error:", err);
    return fail("Failed to update feedback", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const existing = await prisma.feedback.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return fail("Feedback not found", 404);
    }

    const isAdmin = user.email === ADMIN_EMAIL;
    const isOwner = existing.userId === user.id;

    if (!isAdmin && !isOwner) {
      return fail("Unauthorized", 403);
    }

    // Delete associated user notifications first
    await prisma.notification.deleteMany({
      where: { feedbackId: params.id },
    });

    await prisma.feedback.delete({
      where: { id: params.id },
    });

    revalidatePath("/", "layout");
    return ok({ success: true });
  } catch (err) {
    console.error("Feedback deletion error:", err);
    return fail("Failed to delete feedback", 500);
  }
}


