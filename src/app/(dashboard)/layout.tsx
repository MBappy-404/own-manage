import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardLayoutClient user={session.user}>
          {children}
        </DashboardLayoutClient>
      </div>
    </div>
  );
}
