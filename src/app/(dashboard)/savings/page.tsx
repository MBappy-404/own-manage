import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SavingsClient } from "./savings-client";


export const metadata = { title: "Savings goals" };

export default async function SavingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <SavingsClient
      initial={goals.map((g) => ({
        ...g,
        deadline: g.deadline?.toISOString() ?? null,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      }))}
      currency={session.user.currency || "BDT"}
    />
  );
}
