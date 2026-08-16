"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { computeReport } from "@/lib/core";
import { sampleBets } from "@/lib/sample";
import type { StoredReport } from "@/lib/store";
import { ReportView } from "@/components/dashboard/ReportView";

// The demo page renders a sample report in isolation — it deliberately does
// NOT write to the dashboard's report store, so demo data never mixes with
// (or gets counted alongside) real bookmarklet imports.
export default function DemoPage() {
  // The sample report is built from Date.now()-relative dates, so only render
  // it after mount to avoid SSR/hydration mismatches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const reportData = useMemo<StoredReport>(
    () => ({
      id: "demo",
      providerName: "SportyBet",
      currency: "NGN",
      savedAt: new Date().toISOString(),
      report: computeReport(sampleBets(150)),
    }),
    [],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-rule bg-background/80 px-6 backdrop-blur-md max-[520px]:px-4">
        <Link
          href="/"
          className="font-display text-xl font-black uppercase tracking-wider text-gold transition-colors hover:text-cyan"
        >
          Betlytics
        </Link>
        <div className="flex items-center gap-4">
          <span className="rounded-full border border-gold/50 bg-gold/10 px-3 py-1 font-utility text-[10px] font-bold uppercase tracking-wider text-gold">
            Sample data
          </span>
          <Link
            href="/dashboard"
            className="font-utility text-sm font-bold uppercase tracking-wider text-ink transition hover:text-cyan"
          >
            Open Dashboard →
          </Link>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        {mounted ? <ReportView reportData={reportData} showShare={false} /> : null}
      </div>
    </div>
  );
}
