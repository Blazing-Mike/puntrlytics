"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function PayloadHandler() {
  const setPayload = useAppStore((state) => state.setPayload);

  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        // The bookmarklet sets window.open("/dashboard#" + encodeURIComponent(JSON.stringify(payload)))
        const rawPayload = decodeURIComponent(hash.substring(1));
        const payload = JSON.parse(rawPayload);
        
        if (payload && payload.report) {
          setPayload(payload);
        }
        
        // Clear the hash without triggering a scroll or reload
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } catch (err) {
      console.error("[Betlytics] Failed to parse payload from URL hash:", err);
    }
  }, [setPayload]);

  return null;
}
