import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { DebtsClient } from "./debts-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DebtsPage() {
  const { user } = await requireUser();
  if (!user) return null;

  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const accounts = await prisma.financeAccount.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  // Serialize for Client Component (Plain objects only)
  const serializedDebts = debts.map(d => ({
    id: d.id,
    personName: d.personName,
    amount: d.amount,
    type: d.type as "GIVEN" | "TAKEN",
    status: d.status as "PENDING" | "PAID",
    dueDate: d.dueDate ? d.dueDate.toISOString() : null,
    notes: d.notes,
    phone: d.phone,
    financeAccountId: d.financeAccountId,
  }));

  const serializedAccounts = accounts.map(a => ({
    id: a.id,
    name: a.name,
    balance: a.balance,
    currency: a.currency,
  }));

  return (
    <DebtsClient
      initial={serializedDebts}
      accounts={serializedAccounts}
      currency={user.currency}
    />
  );
}
