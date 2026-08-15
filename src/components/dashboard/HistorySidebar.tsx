"use client";

import { useAppStore } from "@/lib/store";
import { fmtMoney } from "@/lib/core";
import dayjs from "dayjs";

import { ProviderLogo } from "@/components/ProviderLogo";

export function HistorySidebar() {
  const reports = useAppStore((state) => state.reports);
  const activeId = useAppStore((state) => state.activeId);
  const setActiveId = useAppStore((state) => state.setActiveId);
  const deleteReport = useAppStore((state) => state.deleteReport);

  const totalProfit = reports.reduce((s, r) => s + r.report.netProfit, 0);
  const bestRoi = reports.length > 0 ? Math.max(...reports.map((r) => r.report.roi)) : 0;
  const currency = reports.length > 0 ? reports[0].currency : "NGN";

  return (
    <aside className="w-[320px] flex flex-col border-r border-[var(--color-rule)] bg-[var(--color-ticket2)]">
      {/* Global Stats */}
      <div className="flex flex-col gap-3 border-b border-[var(--color-rule)] bg-[var(--color-ticket)] p-5">
        <div className="flex justify-between">
          <span className="font-utility text-xs font-bold uppercase tracking-[1.4px] text-[var(--color-faint)]">
            Reports
          </span>
          <span className="font-mono text-sm font-bold text-[var(--color-ink)]">{reports.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-utility text-xs font-bold uppercase tracking-[1.4px] text-[var(--color-faint)]">
            Net Profit
          </span>
          <span className={`font-mono text-sm font-bold ${totalProfit >= 0 ? "text-[var(--color-lime)]" : "text-[var(--color-rose)]"}`}>
            {fmtMoney(totalProfit, currency, true)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-utility text-xs font-bold uppercase tracking-[1.4px] text-[var(--color-faint)]">
            Best ROI
          </span>
          <span className={`font-mono text-sm font-bold ${bestRoi >= 0 ? "text-[var(--color-lime)]" : "text-[var(--color-rose)]"}`}>
            {bestRoi >= 0 ? "+" : ""}{bestRoi.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-[var(--color-ticket2)] px-4 py-3 font-utility text-[10px] font-bold uppercase tracking-[1.5px] text-[var(--color-faint)] backdrop-blur-md">
          History
        </div>
        <div className="flex flex-col">
          {reports.map((r) => {
            const isActive = activeId === r.id;
            const isPos = r.report.netProfit >= 0;

            return (
              <div
                key={r.id}
                className={`group relative flex cursor-pointer items-center justify-between border-l-4 p-4 pr-10 transition-colors hover:bg-[var(--color-ticket)] ${isActive
                  ? "border-[var(--color-gold)] bg-[var(--color-ticket)]"
                  : "border-transparent"
                  }`}
                onClick={() => setActiveId(r.id)}
              >
                <div className="flex items-center gap-3">
                  <ProviderLogo providerName={r.providerName} size={40} />
                  <div className="flex flex-col">
                    <span className="font-bold text-[var(--color-ink)]">{r.providerName}</span>
                    <span className="font-utility text-[11px] text-[var(--color-faint)]">
                      {dayjs(r.savedAt).format("MMM D, YYYY h:mm A")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-mono text-sm font-bold ${isPos ? "text-[var(--color-lime)]" : "text-[var(--color-rose)]"}`}>
                    {fmtMoney(r.report.netProfit, r.currency, true)}
                  </span>
                  <span className={`font-mono text-xs ${r.report.roi >= 0 ? "text-[var(--color-lime)]" : "text-[var(--color-rose)]"}`}>
                    {r.report.roi >= 0 ? "+" : ""}{r.report.roi.toFixed(1)}%
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  className="absolute right-2 top-1/4 -translate-y-1/2 hidden h-6 w-6 items-center justify-center rounded-full bg-[var(--color-rose)] text-[#fff] shadow-lg hover:opacity-80 group-hover:flex focus-visible:flex"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteReport(r.id);
                  }}
                  title="Delete Report"
                  aria-label="Delete Report"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
