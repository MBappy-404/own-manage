import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      currency: true,
      monthlyBudget: true,
      image: true,
    },
  });
  return (
    <SettingsClient
      initial={{
        name: profile?.name ?? "",
        email: profile?.email ?? "",
        currency: profile?.currency ?? "USD",
        monthlyBudget: profile?.monthlyBudget ?? null,
      }}
    />
  );
}
