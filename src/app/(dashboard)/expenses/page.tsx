import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ExpensesClient } from "./expenses-client";


export const metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = session.user.id;
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  const serialized = expenses.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));
  return (
    <ExpensesClient
      initial={serialized}
      currency={session.user.currency || "BDT"}
    />
  );
}
