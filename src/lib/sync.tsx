"use client";

import * as React from "react";
import { toast } from "sonner";
import { clearMutation, getQueuedMutations, enqueueMutation } from "./offline-db";

/**
 * Global provider to handle background synchronization of offline actions
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {

  const sync = React.useCallback(async () => {
    const queue = await getQueuedMutations();
    if (queue.length === 0) return;

    toast.info(`Syncing ${queue.length} offline changes...`);

    for (const item of queue) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.body),
        });

        if (res.ok) {
          await clearMutation(item.id!);
        } else {
          console.error("Failed to sync item", item, await res.text());
        }
      } catch (err) {
        console.error("Sync fetch error", err);
        break; // Stop processing if we lost connection again
      }
    }

    toast.success("Sync complete");
  }, []);

  React.useEffect(() => {
    const handleOnline = () => {
      sync();
    };
    const handleOffline = () => {
      toast.warning("You are currently offline. Changes will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // Initial check
    if (!navigator.onLine) handleOffline();
    else sync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [sync]);

  return <>{children}</>;
}

/**
 * Helper to perform a fetch that queues if offline
 */
export async function smartFetch(url: string, options: RequestInit = {}) {
  if (typeof window !== "undefined" && !navigator.onLine && options.method !== "GET") {
    await enqueueMutation({
      url,
      method: options.method || "POST",
      body: options.body ? JSON.parse(options.body as string) : {},
    });
    return { ok: true, status: 200, json: async () => ({ offline: true }) } as Response;
  }
  return fetch(url, options);
}
