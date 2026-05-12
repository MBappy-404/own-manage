"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { LockScreen } from "../shared/lock-screen";


interface LockContextType {
  isLocked: boolean;
  unlock: (password: string) => Promise<boolean>;
}

const LockContext = React.createContext<LockContextType | null>(null);

export function LockProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [isLocked, setIsLocked] = React.useState(() => {
    if (typeof window !== "undefined") {
      const hasPassword = localStorage.getItem("has_app_password") === "true";
      const sessionUnlocked = sessionStorage.getItem("app_unlocked") === "true";
      return hasPassword && !sessionUnlocked;
    }
    return false;
  });
  const [appPassword, setAppPassword] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Fetch app password status
  React.useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.profile?.appPassword) {
            const pwd = data.profile.appPassword;
            setAppPassword(pwd);
            localStorage.setItem("has_app_password", "true");
            
            // Check if already unlocked in this session
            const sessionUnlocked = sessionStorage.getItem("app_unlocked");
            if (!sessionUnlocked) {
              setIsLocked(true);
            }
          } else {
            localStorage.removeItem("has_app_password");
            setIsLocked(false);
          }
          setIsInitialized(true);
        })
        .catch(() => {
          setIsInitialized(true);
        });
    } else if (status === "unauthenticated") {
      setIsInitialized(true);
      setIsLocked(false);
    }
  }, [status]);

  // Handle visibility change (lock when leaving for more than 5 mins)
  React.useEffect(() => {
    if (!appPassword) return;

    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.visibilityState === "hidden") {
        // Record when the user left the tab
        sessionStorage.setItem("last_hidden_time", now.toString());
      } else if (document.visibilityState === "visible") {
        const lastHiddenTime = sessionStorage.getItem("last_hidden_time");
        
        if (lastHiddenTime && !isLocked) {
          const elapsed = now - parseInt(lastHiddenTime, 10);
          const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
          
          if (elapsed > fiveMinutes) {
            setIsLocked(true);
            sessionStorage.removeItem("app_unlocked");
          }
          // Clear the timestamp after checking
          sessionStorage.removeItem("last_hidden_time");
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => window.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [appPassword, isLocked]);

  const unlock = async (password: string) => {
    if (password === appPassword) {
      setIsLocked(false);
      sessionStorage.setItem("app_unlocked", "true");
      return true;
    }
    return false;
  };

  const showLock = isLocked && (!!appPassword || (typeof window !== "undefined" && localStorage.getItem("has_app_password") === "true"));

  if (!isInitialized && status === "authenticated" && !showLock) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LockContext.Provider value={{ isLocked, unlock }}>
      {showLock && (
        <LockScreen onUnlock={unlock} />
      )}
      <div 
        aria-hidden={showLock}
        style={{ 
          filter: showLock ? "blur(20px)" : "none", 
          opacity: showLock ? 0 : 1,
          pointerEvents: showLock ? "none" : "auto",
          transition: "filter 0.3s ease, opacity 0.3s ease" 
        }}
      >
        {children}
      </div>
    </LockContext.Provider>
  );
}

export const useLock = () => {
  const context = React.useContext(LockContext);
  if (!context) throw new Error("useLock must be used within a LockProvider");
  return context;
};
