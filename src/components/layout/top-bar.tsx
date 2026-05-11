"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Menu, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button";
import { useI18n } from "@/lib/i18n/provider";
import { getInitials } from "@/lib/utils";

type Props = {
  user: { name?: string | null; email?: string | null; image?: string | null };
};

export function TopBar({ user }: Props) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3 border-b bg-background/70 backdrop-blur-xl safe-top">
      <Link href="/dashboard" className="md:hidden flex items-center gap-2">
        <div className="grid place-items-center w-8 h-8 rounded-lg bg-premium-gradient text-white">
          <Wallet className="w-4 h-4" />
        </div>
        <span className="font-bold">{t("common.appName")}</span>
      </Link>
      <div className="hidden md:flex flex-1 max-w-md" />
      <div className="flex items-center gap-1.5">
        <LanguageToggle />
        <ThemeToggleButton />
        <Button size="icon-sm" variant="ghost" aria-label={t("common.theme")}>
          <Bell className="w-4 h-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full hover:bg-accent/40 p-1 pr-3 transition-colors">
              <Avatar className="w-8 h-8">
                {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                {user.name ?? "Account"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Menu className="w-4 h-4" />
                {t("nav.settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              {t("common.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
