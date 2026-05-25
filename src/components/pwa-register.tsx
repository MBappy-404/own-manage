"use client";

import * as React from "react";

export function PWARegister() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update();
          if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        })
        .catch((err) => console.warn("SW registration failed", err));
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
