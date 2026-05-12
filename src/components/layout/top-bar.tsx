"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Menu, Settings, Wallet } from "lucide-react";

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
  onMenuClick?: () => void;
};

export function TopBar({ user, onMenuClick }: Props) {
  const { t } = useI18n();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3 border-b bg-background/70 backdrop-blur-xl safe-top">
        {/* Left: logo (mobile) */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-premium-gradient text-white">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="font-bold hidden xs:inline-block">
              {t("common.appName")}
            </span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-md" />

        {/* Right: actions */}
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
                  <Settings className="w-4 h-4" />
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
    </>
  );
}
