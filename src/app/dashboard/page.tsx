"use client";

import { useAppStore } from "@/lib/store";
import { HistorySidebar } from "@/components/dashboard/HistorySidebar";
import { ReportView } from "@/components/dashboard/ReportView";

export default function DashboardPage() {
  const reports = useAppStore((state) => state.reports);
  const activeId = useAppStore((state) => state.activeId);

  const activeReport = reports.find((r) => r.id === activeId);

  if (reports.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl border border-[var(--color-rule)] bg-[var(--color-ticket)] p-8 shadow-2xl">
          <div className="mb-4 text-4xl">∅</div>
          <h2 className="mb-4 text-xl font-bold text-[var(--color-ink)]">No saved reports yet</h2>
          <p className="text-[var(--color-faint)] leading-relaxed">
            Open <b>SportyBet</b> or <b>football.com</b>, run the Betlytics bookmarklet, and your report will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for History */}
      <HistorySidebar />
      
      {/* Main Report View */}
      <main className="flex-1 overflow-y-auto bg-[var(--color-background)]">
        {activeReport ? (
          <ReportView reportData={activeReport} />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-faint)]">
            Select a report from the history to view it.
          </div>
        )}
      </main>
    </div>
  );
}
