import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { DebtsClient } from "./debts-client";

export default async function DebtsPage() {
  const { user } = await requireUser();
  if (!user) return null;

  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Serialize for Client Component (Plain objects only)
  const serializedDebts = debts.map(d => ({
    id: d.id,
    personName: d.personName,
    amount: d.amount,
    type: d.type,
    status: d.status,
    dueDate: d.dueDate ? d.dueDate.toISOString() : null,
    notes: d.notes,
  }));

  return <DebtsClient initial={serializedDebts} currency={user.currency} />;
}
