"use client";

import * as React from "react";
import { Bell, X, Sparkles, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";

// Pure Web Audio API double-chime synthesizer (requires no external assets)
function playPremiumChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First chime (higher pitch)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(830.61, ctx.currentTime); // Ab5
    gain1.gain.setValueAtTime(0.05, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.5);

    // Second chime (slightly offset, harmonic pitch)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
    gain2.gain.setValueAtTime(0.05, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.warn("Audio context playback failed:", e);
  }
}

export function NotificationListener() {
  const { t, locale } = useI18n();
  const [showPrompt, setShowPrompt] = React.useState<boolean>(false);

  // Sync current permission status
  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      // Show prompt if the permission is default and they haven't dismissed it this session
      const dismissed = sessionStorage.getItem("ownmanage_notif_dismissed");
      if (Notification.permission === "default" && !dismissed) {
        // Delay slightly for smooth entering
        const timer = setTimeout(() => setShowPrompt(true), 3500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const status = await Notification.requestPermission();
      setShowPrompt(false);
      if (status === "granted") {
        playPremiumChime();
        toast.success(
          locale === "bn"
            ? "নোটিফিকেশন সফলভাবে চালু হয়েছে! 🔔"
            : "Notifications enabled successfully! 🔔"
        );
      }
    } catch (err) {
      console.error("Failed to request permission:", err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("ownmanage_notif_dismissed", "true");
  };

  // Background polling loop for active notifications
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const pollNotifications = async () => {
      try {
        const res = await fetch("/api/notifications/latest", { cache: "no-store" });
        if (!res.ok) return;
        const list = await res.json();
        if (!Array.isArray(list)) return;

        // Retrieve previously alerted list
        const storedStr = localStorage.getItem("ownmanage_alerted_ids") || "[]";
        let alertedIds: string[] = [];
        try {
          alertedIds = JSON.parse(storedStr);
        } catch {
          alertedIds = [];
        }

        let hasNew = false;
        const newAlertedIds = [...alertedIds];

        // Process unread notifications
        for (const notif of list) {
          if (!notif.read && !alertedIds.includes(notif.id)) {
            hasNew = true;
            newAlertedIds.push(notif.id);

            // 1. Show interactive Sonner toast in the foreground
            triggerToast(notif.title, notif.message, notif.type);

            // 2. Trigger native OS/mobile push notification
            if (Notification.permission === "granted") {
              try {
                if ("serviceWorker" in navigator) {
                  navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification(notif.title, {
                      body: notif.message,
                      icon: "/icons/icon-192.svg",
                      tag: notif.id,
                    });
                  });
                } else {
                  new Notification(notif.title, {
                    body: notif.message,
                    icon: "/icons/icon-192.svg",
                  });
                }
              } catch {
                new Notification(notif.title, {
                  body: notif.message,
                  icon: "/icons/icon-192.svg",
                });
              }
            }
          }
        }

        // If new notifications were found, play chime and update localStorage
        if (hasNew) {
          playPremiumChime();
          localStorage.setItem("ownmanage_alerted_ids", JSON.stringify(newAlertedIds));
          // Dispatch a custom event to notify other components (e.g. TopBar Bell badge)
          window.dispatchEvent(new Event("ownmanage_new_notifications"));
        }
      } catch (err) {
        console.warn("Failed to poll notifications:", err);
      }
    };

    // Initial delay, then poll every 10 seconds
    const initialTimer = setTimeout(pollNotifications, 2000);
    const interval = setInterval(pollNotifications, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Sonner toast customization depending on notification levels
  const triggerToast = (title: string, message: string, type: string) => {
    switch (type) {
      case "SUCCESS":
        toast(title, {
          description: message,
          icon: <CheckCircle2 className="w-5 h-5 text-success" />,
          className: "border-success/30 bg-success/5 text-foreground rounded-2xl",
          duration: 6000,
        });
        break;
      case "WARNING":
        toast(title, {
          description: message,
          icon: <AlertTriangle className="w-5 h-5 text-warning" />,
          className: "border-warning/30 bg-warning/5 text-foreground rounded-2xl",
          duration: 7000,
        });
        break;
      case "ALERT":
        toast(title, {
          description: message,
          icon: <AlertOctagon className="w-5 h-5 text-destructive" />,
          className: "border-destructive/30 bg-destructive/5 text-foreground rounded-2xl animate-pulse",
          duration: 8000,
        });
        break;
      default:
        toast(title, {
          description: message,
          icon: <Bell className="w-5 h-5 text-primary" />,
          className: "border-primary/30 bg-primary/5 text-foreground rounded-2xl",
          duration: 6000,
        });
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-[380px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="relative p-4 rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-xl shadow-2xl flex gap-3 overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-primary/20 blur-xl group-hover:scale-125 transition-transform" />
        
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-premium-gradient text-white shrink-0 shadow-md">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>
        
        <div className="flex-1 space-y-2 pr-6">
          <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-foreground">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            {t("notifications.permissionBannerTitle")}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("notifications.permissionBannerDesc")}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleRequestPermission}
              className="rounded-xl px-4 text-xs font-bold shadow-sm"
            >
              {t("notifications.permissionBannerCTA")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="rounded-xl px-3 text-xs text-muted-foreground"
            >
              {locale === "bn" ? "পরে" : "Later"}
            </Button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-muted text-muted-foreground/60 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
