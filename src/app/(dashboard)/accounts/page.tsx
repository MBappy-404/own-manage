import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-helpers";
import { AccountsClient } from "./accounts-client";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountsPage() {
  const { user } = await requireUser();
  if (!user) return null;

  const accounts = await prisma.financeAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Serialize for Client Component (Plain objects only)
  const serializedAccounts = accounts.map(acc => ({
    id: acc.id,
    name: acc.name,
    balance: acc.balance,
    currency: acc.currency,
    icon: acc.icon,
  }));

  return <AccountsClient initial={serializedAccounts} currency={user.currency} />;
}
