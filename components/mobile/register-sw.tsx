"use client";

import { useEffect } from "react";

/** Registers the service worker for the mobile app only (scope "/app"). Production builds only. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/app" }).catch(() => {
      // Without a worker the app still works online; offline opening just is not available.
    });
  }, []);
  return null;
}
