import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireUser } from "@/lib/api-helpers";
import { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "sadikulsad0810@gmail.com";

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  if (user.email !== ADMIN_EMAIL) {
    return fail("Unauthorized", 403);
  }

  try {
    const { title, message, type } = await req.json();

    if (!title || typeof title !== "string") {
      return fail("Title is required", 400);
    }
    if (!message || typeof message !== "string") {
      return fail("Message is required", 400);
    }

    const validTypes: NotificationType[] = ["INFO", "WARNING", "SUCCESS", "ALERT"];
    const notifType = validTypes.includes(type) ? (type as NotificationType) : "INFO";

    // 1. Save broadcast in admin history
    const broadcast = await prisma.broadcastHistory.create({
      data: {
        title,
        message,
        type: notifType,
      },
    });

    // 2. Fetch all users
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    });

    // 3. Create personal notifications for all users in database
    if (allUsers.length > 0) {
      await prisma.notification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          title,
          message: message,
          type: notifType,
          read: false,
          broadcastId: broadcast.id,
        })),
      });
    }

    revalidatePath("/", "layout");
    return ok({ success: true, broadcast });
  } catch (err) {
    console.error("Broadcast notification creation error:", err);
    return fail("Failed to send broadcast", 500);
  }
}

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  if (user.email !== ADMIN_EMAIL) {
    return fail("Unauthorized", 403);
  }

  try {
    const history = await prisma.broadcastHistory.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok(history);
  } catch (err) {
    console.error("Broadcast history fetch error:", err);
    return fail("Failed to fetch broadcasts", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  if (user.email !== ADMIN_EMAIL) {
    return fail("Unauthorized", 403);
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return fail("Broadcast ID is required", 400);
  }

  try {
    // Delete associated user notifications first
    await prisma.notification.deleteMany({
      where: { broadcastId: id },
    });

    await prisma.broadcastHistory.delete({
      where: { id },
    });

    revalidatePath("/", "layout");
    return ok({ success: true });
  } catch (err) {
    console.error("Delete broadcast error:", err);
    return fail("Failed to delete broadcast", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  if (user.email !== ADMIN_EMAIL) {
    return fail("Unauthorized", 403);
  }

  try {
    const { id, title, message, type } = await req.json();

    if (!id || typeof id !== "string") {
      return fail("Broadcast ID is required", 400);
    }
    if (!title || typeof title !== "string") {
      return fail("Title is required", 400);
    }
    if (!message || typeof message !== "string") {
      return fail("Message is required", 400);
    }

    const validTypes: NotificationType[] = ["INFO", "WARNING", "SUCCESS", "ALERT"];
    const notifType = validTypes.includes(type) ? (type as NotificationType) : "INFO";

    // 1. Update broadcast in admin history
    const broadcast = await prisma.broadcastHistory.update({
      where: { id },
      data: {
        title,
        message,
        type: notifType,
      },
    });

    // 2. Update all corresponding notifications sent to users
    await prisma.notification.updateMany({
      where: { broadcastId: id },
      data: {
        title,
        message,
        type: notifType,
      },
    });

    revalidatePath("/", "layout");
    return ok({ success: true, broadcast });
  } catch (err) {
    console.error("Broadcast notification update error:", err);
    return fail("Failed to update broadcast", 500);
  }
}


