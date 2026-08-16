"use client";

import { useMemo } from "react";
import { useAppStore, type StoredReport } from "@/lib/store";
import { Money } from "@/components/Money";
import dayjs from "dayjs";

import Link from "next/link";
import { ProviderLogo } from "@/components/ProviderLogo";

// The dashboard renders this from the real store (no props). The demo page
// passes its own sample reports so it renders the exact same sidebar with
// demo data — never touching the store.
interface HistorySidebarProps {
  reports?: StoredReport[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** Show the "← Puntrlytics" brand bar. Hidden on the demo page, which has its own header. */
  showBrand?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function HistorySidebar({
  reports: propReports,
  activeId: propActiveId,
  onSelect,
  onDelete,
  showBrand = true,
  isOpen = false,
  onClose,
}: HistorySidebarProps = {}) {
  const storeReports = useAppStore((state) => state.reports);
  const storeActiveId = useAppStore((state) => state.activeId);
  const storeSetActiveId = useAppStore((state) => state.setActiveId);
  const storeDeleteReport = useAppStore((state) => state.deleteReport);

  const reports = propReports ?? storeReports;
  const activeId = propActiveId !== undefined ? propActiveId : storeActiveId;
  const selectReport = onSelect ?? storeSetActiveId;
  const removeReport = onDelete ?? storeDeleteReport;

  // Aggregate stats from the latest report per provider only — a fresh import
  // from a site supersedes earlier ones, so summing every stored entry would
  // double-count the same account. (Also guards against duplicates persisted
  // in localStorage before the store started replacing same-site reports.)
  const latestByProvider = useMemo(() => {
    const map = new Map<string, (typeof reports)[number]>();
    for (const r of reports) {
      const key = r.providerName.toLowerCase();
      const cur = map.get(key);
      if (!cur || new Date(r.savedAt).getTime() > new Date(cur.savedAt).getTime()) {
        map.set(key, r);
      }
    }
    return [...map.values()];
  }, [reports]);

  const totalProfit = latestByProvider.reduce((s, r) => s + r.report.netProfit, 0);
  const bestRoi = latestByProvider.length > 0 ? Math.max(...latestByProvider.map((r) => r.report.roi)) : 0;
  const currency = latestByProvider.length > 0 ? latestByProvider[0].currency : "NGN";

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`w-[320px] flex flex-col border-r border-rule bg-background max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:transition-transform max-md:duration-300 ${isOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`}>
        {/* Brand & Home Link */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-rule bg-background px-5">
          {showBrand ? (
            <Link href="/" className="font-display text-xl font-black uppercase tracking-wider text-gold hover:text-cyan transition-colors">
              &larr; Puntrlytics
            </Link>
          ) : (
            <div className="font-display text-xl font-black uppercase tracking-wider text-gold">History</div>
          )}
          
          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-md text-faint hover:bg-ticket2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan md:hidden"
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

      {/* Global Stats */}
      <div className="flex flex-col gap-3 border-b border-rule bg-background p-5">
        <div className="flex justify-between">
          <span className="font-utility text-xs font-bold uppercase tracking-[1.4px] text-faint">
            Reports
          </span>
          <span className="font-mono text-sm font-bold text-ink">{latestByProvider.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-utility text-xs font-bold uppercase tracking-[1.4px] text-faint">
            Net Profit
          </span>
          <span className={`font-mono text-sm font-bold ${totalProfit >= 0 ? "text-lime" : "text-rose"}`}>
            <Money value={totalProfit} currency={currency} signed symbolClassName="text-[10px]" />
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-utility text-xs font-bold uppercase tracking-[1.4px] text-faint">
            Best ROI
          </span>
          <span className={`font-mono text-sm font-bold ${bestRoi >= 0 ? "text-lime" : "text-rose"}`}>
            {bestRoi >= 0 ? "+" : ""}{bestRoi.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-background px-4 py-3 font-utility text-[10px] font-bold uppercase tracking-[1.5px] text-faint backdrop-blur-md">
          History
        </div>
        <div className="flex flex-col">
          {reports.map((r) => {
            const isActive = activeId === r.id;
            const isPos = r.report.netProfit >= 0;

            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                className={`group relative flex w-full cursor-pointer items-center justify-between border-l-4 p-2 py-5 pr-6 text-left transition-colors focus-visible:outline focus-visible:outline-2 -focus-visible:outline-offset-2 focus-visible:outline-cyan ${isActive
                  ? "border-gold bg-ticket"
                  : "border-transparent"
                  }`}
                onClick={() => selectReport(r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectReport(r.id);
                  }
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ProviderLogo providerName={r.providerName} size={40} />
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <span className="font-bold text-ink truncate">{r.providerName}</span>
                    <span className="font-utility text-[11px] text-faint whitespace-nowrap">
                      {dayjs(r.savedAt).format("MMM D, YYYY h:mm A")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-mono text-sm font-bold ${isPos ? "text-lime" : "text-rose"}`}>
                    <Money value={r.report.netProfit} currency={r.currency} signed symbolClassName="text-[10px]" />
                  </span>
                  <span className={`font-mono text-xs ${r.report.roi >= 0 ? "text-lime" : "text-rose"}`}>
                    {r.report.roi >= 0 ? "+" : ""}{r.report.roi.toFixed(1)}%
                  </span>
                </div>

                {/* Delete Button — always visible on touch, revealed on hover for mouse users */}
                <button
                  className="absolute right-1 top-1/6 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-rule bg-ticket2 text-faint transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cyan md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeReport(r.id);
                  }}
                  title="Delete Report"
                  aria-label="Delete Report"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
                </div>
            );
          })}
        </div>
      </div>
    </aside>
    </>
  );
}
