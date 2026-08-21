"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import * as LZString from "lz-string";

export function PayloadHandler() {
  const setPayload = useAppStore((state) => state.setPayload);

  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const rawHash = hash.substring(1);
        let payload;
        
        // Try decompressing first
        const decompressed = LZString.decompressFromEncodedURIComponent(rawHash);
        if (decompressed) {
          payload = JSON.parse(decompressed);
        } else {
          // Fallback to legacy uncompressed payload (for older bookmarklets)
          const rawPayload = decodeURIComponent(rawHash);
          payload = JSON.parse(rawPayload);
        }
        
        if (payload && payload.report) {
          setPayload(payload);
        }
        
        // Clear the hash without triggering a scroll or reload
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } catch (err) {
      console.error("[Puntrlytics] Failed to parse payload from URL hash:", err);
    }
  }, [setPayload]);

  return null;
}
