"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { computeReport } from "@/lib/core";
import { sampleBets } from "@/lib/sample";
import type { StoredReport } from "@/lib/store";
import { HistorySidebar } from "@/components/dashboard/HistorySidebar";
import { ReportView } from "@/components/dashboard/ReportView";

// The demo page renders sample reports in isolation — it deliberately does
// NOT write to the dashboard's report store, so demo data never mixes with
// (or gets counted alongside) real bookmarklet imports. It reuses the real
// HistorySidebar with local demo data, so it looks exactly like the dashboard.
export default function DemoPage() {
  // Sample reports are built from Date.now()-relative dates, so only build
  // them after mount to avoid SSR/hydration mismatches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initialReports = useMemo<StoredReport[]>(() => {
    const now = Date.now();
    return [
      {
        id: "demo-sportybet",
        providerName: "SportyBet",
        currency: "NGN",
        savedAt: new Date(now - 2 * 86400000).toISOString(),
        report: computeReport(sampleBets(150)),
      },
      {
        id: "demo-football",
        providerName: "football.com",
        currency: "NGN",
        savedAt: new Date(now - 86400000).toISOString(),
        report: computeReport(sampleBets(120)),
      },
    ];
  }, []);

  const [reports, setReports] = useState<StoredReport[]>(initialReports);
  const [activeId, setActiveId] = useState("demo-sportybet");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeReport = reports.find((r) => r.id === activeId) || reports[0];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-rule bg-background/80 px-6 backdrop-blur-md max-[520px]:px-4">
        <Link
          href="/"
          className="font-display text-xl font-black uppercase tracking-wider text-gold transition-colors hover:text-cyan"
        >
          Puntrlytics
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

      {mounted ? (
        <div className="flex min-h-0 flex-1 relative">
          <HistorySidebar
            reports={reports}
            activeId={activeId}
            showBrand={false}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onSelect={(id) => {
              setActiveId(id);
              setIsSidebarOpen(false);
            }}
            onDelete={(id) => {
              setReports((prev) => prev.filter((r) => r.id !== id));
              // If the deleted report was active, fall back to the first remaining one.
              setActiveId((current) =>
                current === id ? reports.filter((r) => r.id !== id)[0]?.id || "" : current,
              );
            }}
          />
          <main className="min-w-0 flex-1">
            <ReportView reportData={activeReport} showShare={false} onToggleSidebar={() => setIsSidebarOpen(true)} />
          </main>
        </div>
      ) : null}
    </div>
  );
}
