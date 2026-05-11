import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReportsClient } from "./reports-client";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" } }),
  ]);
  return (
    <ReportsClient
      incomes={incomes.map((i) => ({ ...i, date: i.date.toISOString() }))}
      expenses={expenses.map((e) => ({ ...e, date: e.date.toISOString() }))}
      currency={session.user.currency || "USD"}
      userName={session.user.name ?? "User"}
    />
  );
}
