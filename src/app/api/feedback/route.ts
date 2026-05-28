import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireUser } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "sadikulsad0810@gmail.com";

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    const { message, rating } = await req.json();
    if (!message || typeof message !== "string") {
      return fail("Message is required", 400);
    }
    const rateValue = typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : 5;

    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        name: user.name ?? "User",
        email: user.email ?? "",
        message,
        rating: rateValue,
        status: "PENDING",
      },
    });

    revalidatePath("/", "layout");
    return ok(feedback);
  } catch (err) {
    console.error("Feedback creation error:", err);
    return fail("Failed to submit feedback", 500);
  }
}

export async function GET() {
  const { error, user } = await requireUser();
  if (error) return error;

  try {
    if (user.email === ADMIN_EMAIL) {
      const feedbacks = await prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
      });
      return ok(feedbacks);
    } else {
      const feedbacks = await prisma.feedback.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return ok(feedbacks);
    }
  } catch (err) {
    console.error("Feedback fetch error:", err);
    return fail("Failed to fetch feedbacks", 500);
  }
}


