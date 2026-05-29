import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SettingsClient } from "./settings-client";


export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const profiles = await (prisma.user as unknown as { aggregateRaw: (args: Record<string, unknown>) => Promise<unknown[]> }).aggregateRaw({
    pipeline: [
      { $match: { _id: { $oid: session.user.id } } },
      { 
        $project: { 
          name: 1, 
          email: 1, 
          currency: 1, 
          monthlyBudget: 1, 
          image: 1, 
          appPassword: 1 
        } 
      }
    ]
  }) as Record<string, unknown>[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = (profiles[0] || null) as Record<string, any> | null;
  return (
    <SettingsClient
      initial={{
        name: (profile?.name as string) ?? "",
        email: (profile?.email as string) ?? "",
        currency: (profile?.currency as string) ?? "BDT",
        monthlyBudget: (profile?.monthlyBudget as number) ?? null,
        appPassword: (profile?.appPassword as string) ?? null,
      }}
    />
  );
}
