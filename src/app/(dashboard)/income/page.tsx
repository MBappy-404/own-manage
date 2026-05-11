import { IncomeClient } from "./income-client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = { title: "Income" };

export default async function IncomePage() {
  const session = (await getServerSession(authOptions))!;
  const userId = session.user.id;
  const incomes = await prisma.income.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  const serialized = incomes.map((i) => ({
    ...i,
    date: i.date.toISOString(),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));
  return (
    <IncomeClient
      initial={serialized}
      currency={session.user.currency || "USD"}
    />
  );
}
