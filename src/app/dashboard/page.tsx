"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { HistorySidebar } from "@/components/dashboard/HistorySidebar";
import { ReportView } from "@/components/dashboard/ReportView";

export default function DashboardPage() {
  const reports = useAppStore((state) => state.reports);
  const activeId = useAppStore((state) => state.activeId);

  const activeReport = reports.find((r) => r.id === activeId);

  // The dashboard is statically prerendered with no reports, so before the
  // client mounts the store hasn't rehydrated from localStorage and the
  // bookmarklet's URL-hash payload hasn't been applied yet. Rendering the
  // empty state here is what flashes right before the real report appears.
  // Hold the page on an invisible frame until that first client pass is done.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-rule border-t-gold" />
        <span className="font-utility text-xs font-bold uppercase tracking-[2px] text-faint">
          Loading report…
        </span>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl border border-rule bg-background p-8 shadow-2xl">
          <div className="mb-4 text-4xl">∅</div>
          <h2 className="mb-4 text-xl font-bold text-ink">No saved reports yet</h2>
          <p className="text-faint leading-relaxed mb-6">
            Open <b>SportyBet</b>, <b>MSport</b>, <b>Stake</b> or <b>football.com</b>, run the Betlytics bookmarklet, and your report will appear here.
          </p>
          <Link href="/" className="inline-block rounded-full bg-ticket2 px-6 py-2.5 font-utility text-sm font-bold uppercase tracking-wider text-ink transition hover:bg-rule hover:text-cyan">
            &larr; Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden ">
      {/* Sidebar for History */}
      <HistorySidebar />

      {/* Main Report View */}
      <main className="flex-1 overflow-y-auto">
        {activeReport ? (
          <ReportView reportData={activeReport} />
        ) : (
          <div className="flex h-full items-center justify-center text-faint">
            Select a report from the history to view it.
          </div>
        )}
      </main>
    </div>
  );
}
