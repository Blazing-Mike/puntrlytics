"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { computeReport } from "@/lib/core";
import { sampleBets } from "@/lib/sample";
import { useAppStore } from "@/lib/store";

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    const { reports, setPayload } = useAppStore.getState();

    // Only inject demo reports if the user has no reports yet
    if (reports.length === 0) {
      // 1. football.com (Oldest)
      setPayload({
        report: computeReport(sampleBets(80)),
        providerName: "football.com",
        currency: "NGN",
        savedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      });

      // 2. SportyBet (Newest)
      setPayload({
        report: computeReport(sampleBets(150)),
        providerName: "SportyBet",
        currency: "NGN",
        savedAt: new Date().toISOString(),
      });
    }

    // Redirect to the dashboard to view the reports
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
      <div className="text-center font-mono text-[var(--color-faint)]">
        <p className="mb-4 text-xl">Generating Demo Report...</p>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--color-gold)] border-r-transparent align-[-0.125em]" />
      </div>
    </div>
  );
}
