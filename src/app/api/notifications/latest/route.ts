import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return ok(notifications);
  } catch (err) {
    console.error("Fetch notifications error:", err);
    return fail("Failed to fetch notifications", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return fail("ids array is required", 400);
    }

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        id: { in: ids },
      },
      data: {
        read: true,
      },
    });

    revalidatePath("/", "layout");
    return ok({ success: true });
  } catch (err) {
    console.error("Update notifications error:", err);
    return fail("Failed to update notifications", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      // Delete specific notification
      await prisma.notification.delete({
        where: { id, userId: user.id },
      });
    } else {
      // Clear all notifications
      await prisma.notification.deleteMany({
        where: { userId: user.id },
      });
    }

    revalidatePath("/", "layout");
    return ok({ success: true });
  } catch (err) {
    console.error("Delete notification error:", err);
    return fail("Failed to delete notification", 500);
  }
}

