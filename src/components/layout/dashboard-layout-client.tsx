"use client";

import * as React from "react";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleOpen = React.useCallback(() => setSidebarOpen(true), []);
  const handleClose = React.useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      <TopBar user={user} onMenuClick={handleOpen} />
      <main className="flex-1 pb-24 md:pb-8">
        <div className="container max-w-[1400px] py-4 md:py-8">{children}</div>
      </main>
      <BottomNav onMenuClick={handleOpen} />
      <MobileSidebar isOpen={sidebarOpen} onClose={handleClose} />
    </>
  );
}
