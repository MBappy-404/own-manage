"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { 
  Bell, 
  LogOut, 
  Settings, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Info,
  Trash
} from "lucide-react";

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
import { toast } from "sonner";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ALERT";
  read: boolean;
  createdAt: string;
};

type Props = {
  user: { name?: string | null; email?: string | null; image?: string | null };
};

export function TopBar({ user }: Props) {
  const { t, locale } = useI18n();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/latest", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.read).length);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch notifications in TopBar:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();

    const handleNewNotif = () => {
      fetchNotifications();
    };
    window.addEventListener("ownmanage_new_notifications", handleNewNotif);
    return () => window.removeEventListener("ownmanage_new_notifications", handleNewNotif);
  }, [fetchNotifications]);

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      // Mark all unread as read
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        try {
          await fetch("/api/notifications/latest", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: unreadIds }),
          });
          setNotifications((prev) =>
            prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: true } : n))
          );
          setUnreadCount(0);
        } catch (err) {
          console.warn("Failed to mark notifications as read:", err);
        }
      }
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle2 className="w-4 h-4 text-success shrink-0" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-warning shrink-0" />;
      case "ALERT":
        return <AlertOctagon className="w-4 h-4 text-destructive shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-primary shrink-0" />;
    }
  };

  const formatNotifTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) {
        return locale === "bn" ? "এইমাত্র" : "Just now";
      }
      if (diffMins < 60) {
        return locale === "bn" ? `${diffMins} মিনিট আগে` : `${diffMins}m ago`;
      }
      if (diffHours < 24) {
        return locale === "bn" ? `${diffHours} ঘণ্টা আগে` : `${diffHours}h ago`;
      }
      return date.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3 border-b bg-background/70 backdrop-blur-xl safe-top">
        {/* Left: logo */}
        <div className="flex items-center gap-2">
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

          {/* NOTIFICATION BELL WITH BADGE & DROPDOWN */}
          <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button 
                size="icon-sm" 
                variant="ghost" 
                className="relative active:scale-95 transition-transform" 
                aria-label={t("notifications.title")}
              >
                <Bell className={`w-4.5 h-4.5 ${unreadCount > 0 ? "animate-pulse text-foreground" : "text-muted-foreground"}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1 bg-card/95 backdrop-blur-xl shadow-2xl border border-border/60">
              <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-primary" />
                  {t("notifications.title")}
                </span>
                
                {/* CLEAR ALL BUTTON */}
                {notifications.length > 0 && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm(locale === "bn" ? "সব নোটিফিকেশন মুছে ফেলতে চান?" : "Are you sure you want to clear all notifications?")) return;
                      try {
                        const res = await fetch("/api/notifications/latest", { method: "DELETE" });
                        if (res.ok) {
                          setNotifications([]);
                          setUnreadCount(0);
                          toast.success(locale === "bn" ? "সব নোটিফিকেশন মুছে ফেলা হয়েছে" : "All notifications cleared");
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="text-[10px] text-muted-foreground hover:text-destructive font-semibold transition-colors bg-muted/60 px-2 py-0.5 rounded border"
                  >
                    {locale === "bn" ? "সব মুছুন" : "Clear All"}
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="max-h-[300px] overflow-y-auto divide-y divide-border/40">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center text-xs text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    {t("notifications.empty")}
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-3 text-xs leading-relaxed transition-colors hover:bg-muted/45 relative flex gap-2.5 items-start group/row ${
                        !notif.read ? "bg-primary/5 font-medium" : ""
                      }`}
                    >
                      {getNotifIcon(notif.type)}
                      <div className="flex-1 min-w-0 space-y-0.5 pr-5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-extrabold text-foreground break-words">
                            {notif.title}
                          </p>
                          <span className="text-[9px] text-muted-foreground shrink-0 font-medium group-hover/row:opacity-0 transition-opacity mt-0.5">
                            {formatNotifTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-muted-foreground font-normal break-words whitespace-pre-line">
                          {notif.message}
                        </p>
                      </div>

                      {/* INDIVIDUAL ROW DELETE BUTTON */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(`/api/notifications/latest?id=${notif.id}`, { method: "DELETE" });
                            if (res.ok) {
                              setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                              setUnreadCount((prev) => (notif.read ? prev : Math.max(0, prev - 1)));
                              toast.success(locale === "bn" ? "নোটিফিকেশনটি মুছে ফেলা হয়েছে" : "Notification deleted");
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="absolute right-2 top-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover/row:opacity-100 transition-opacity"
                        aria-label="Delete"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>

                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5 absolute right-2.5 top-1/2 -translate-y-1/2 group-hover/row:opacity-0 transition-opacity" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* USER ACCOUNT DROPDOWN */}
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
            
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1 bg-card/95 backdrop-blur-xl shadow-2xl border border-border/60">
              <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground truncate">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-xl">
                <Link href="/settings" className="flex items-center gap-2 px-3 py-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  {t("nav.settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-destructive focus:text-destructive rounded-xl px-3 py-2 cursor-pointer flex items-center gap-2"
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
