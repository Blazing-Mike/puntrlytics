"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { fmtMoney, type BreakdownBucket, type DaySummary } from "@/lib/core";
import { Money } from "@/components/Money";
import type { StoredReport } from "@/lib/store";
import dayjs from "dayjs";
import { ProviderLogo } from "@/components/ProviderLogo";
import { toPng } from "html-to-image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from "recharts";

export function ReportView({ reportData, showShare = true, onToggleSidebar }: { reportData: StoredReport; showShare?: boolean; onToggleSidebar?: () => void }) {
  const { report, providerName, currency, savedAt } = reportData;

  const isPos = report.netProfit >= 0;
  const isRoiPos = report.roi >= 0;

  // Transform timeline for chart
  const chartData = useMemo(() => {
    return report.timeline.map((day: DaySummary) => ({
      ...day,
      displayDate: day.date === "Unknown Date" ? "?" : dayjs(day.date).format("MMM D"), // mm-dd
    }));
  }, [report.timeline]);

  const shareRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!shareRef.current) return;
    try {
      setIsSharing(true);
      // Fill the canvas with the app's dark grid background (a transparent PNG
      // would show white in most viewers); the card keeps its rounded corners
      // on top of that background.
      const dataUrl = await toPng(shareRef.current, {
        cacheBust: true,
        backgroundColor: "#0a0d12",
        style: { transform: "scale(1)" }
      });
      const link = document.createElement("a");
      link.download = `Puntrlytics-Report-${providerName}-${dayjs().format("YYYY-MM-DD")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to share report:", err);
      alert("Failed to generate report image.");
    } finally {
      setIsSharing(false);
    }
  }, [providerName]);

  return (
    <div className="flex h-full flex-col font-sans text-ink relative">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-rule bg-background/80 px-4 py-3 md:px-8 md:py-5 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 md:gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-faint hover:bg-ticket2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
              aria-label="Toggle sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
            </button>
          )}
          <div className="hidden sm:block">
            <ProviderLogo providerName={providerName} size={48} />
          </div>
          <div className="flex flex-col gap-0.5 md:gap-1">
            <h1 className="text-lg md:text-2xl font-black uppercase text-gold leading-none">Performance</h1>
            <p className="font-utility text-[10px] md:text-xs tracking-wider text-ink/80 truncate max-w-[140px] md:max-w-none">
              {providerName} • Gen: {dayjs(savedAt).format("MMM D")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="font-utility text-xs tracking-wider text-faint uppercase">
              Period
            </span>
            <span className="font-mono text-sm">
              {report.period.first ? dayjs(report.period.first).format("MMM D, YYYY") : "?"} — {report.period.last ? dayjs(report.period.last).format("MMM D, YYYY") : "?"}
            </span>
          </div>
          {showShare && (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="rounded bg-cyan/20 px-3 py-1.5 md:px-4 md:py-2 font-bold text-cyan text-[10px] md:text-xs uppercase tracking-wider hover:bg-cyan/30 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan whitespace-nowrap"
            >
              {isSharing ? "Gen..." : "Share"}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 min-h-full">
          {/* Top KPIs */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 md:col-span-1">
              <StatCard title="Net Profit" value={<Money value={report.netProfit} currency={currency} signed />} colorClass={isPos ? "text-lime" : "text-rose"} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <StatCard title="ROI" value={`${isRoiPos ? "+" : ""}${report.roi.toFixed(1)}%`} colorClass={isRoiPos ? "text-lime" : "text-rose"} />
            </div>
            <StatCard title="Win Rate" value={`${report.winRate.toFixed(1)}%`} />
            <StatCard title="Total Bets" value={report.totalBets.toLocaleString()} />
            <StatCard title="Settled Bets" value={report.settledTotal.toLocaleString()} />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatCard title="Total Stakes" value={<Money value={report.totalStakes} currency={currency} />} />
            <StatCard title="Total Payouts" value={<Money value={report.totalPayouts} currency={currency} />} />
          </section>

          {/* Extremes */}
          {(report.biggestWin || report.biggestLoss) && (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {report.biggestWin && report.biggestWin.payout > 0 && (
                <StatCard
                  title="Biggest Win"
                  value={<Money value={report.biggestWin.payout} currency={currency} />}
                  colorClass="text-lime"
                  subtitle={`Stake: ${fmtMoney(report.biggestWin.stake, currency)} • ${dayjs(report.biggestWin.date).format("MMM D, YYYY")}`}
                />
              )}
              {report.biggestLoss && report.biggestLoss.stake > 0 && (
                <StatCard
                  title="Biggest Loss"
                  value={<Money value={-report.biggestLoss.stake} currency={currency} />}
                  colorClass="text-rose"
                  subtitle={`Stake: ${fmtMoney(report.biggestLoss.stake, currency)} • ${dayjs(report.biggestLoss.date).format("MMM D, YYYY")}`}
                />
              )}
            </section>
          )}

          {/* Charts Section */}
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ChartCard title="Daily Net Profit">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: "var(--color-faint)" }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => fmtMoney(val, currency)} tick={{ fontSize: 11, fill: "var(--color-faint)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "var(--color-rule)", opacity: 0.2 }}
                    contentStyle={{ backgroundColor: "var(--color-ticket2)", borderColor: "var(--color-rule)", color: "var(--color-ink)", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                    itemStyle={{ color: "var(--color-ink)", fontWeight: "bold" }}
                    labelStyle={{ color: "var(--color-faint)", marginBottom: 4 }}
                    formatter={(val: any) => fmtMoney(Number(val) || 0, currency, true)}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "var(--color-lime)" : "var(--color-rose)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Cumulative ROI Trend">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: "var(--color-faint)" }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `${val}%`} tick={{ fontSize: 11, fill: "var(--color-faint)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-ticket2)", borderColor: "var(--color-rule)", color: "var(--color-ink)", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                    itemStyle={{ color: "var(--color-ink)", fontWeight: "bold" }}
                    labelStyle={{ color: "var(--color-faint)", marginBottom: 4 }}
                    formatter={(val: any) => `${val > 0 ? "+" : ""}${Number(val).toFixed(2)}%`}
                  />
                  <Line type="monotone" dataKey="roi" stroke="var(--color-gold)" strokeWidth={3} dot={{ r: 3, fill: "var(--color-gold)" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          {/* Breakdowns */}
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <BreakdownTable title="Performance by Odds Range" data={report.odds} currency={currency} />
            <BreakdownTable title="Performance by Stake Size" data={report.stakeBuckets} currency={currency} />
            <BreakdownTable title="Performance by Bet Type" data={report.betTypes} currency={currency} />          <BreakdownTable title="Top Sports" data={report.bySport} currency={currency} />
          </section>
        </div>
      </div>

      {/* Share summary card — parked off-screen in a wrapper. html-to-image only
          clones the inner node (whose own styles are clean), so it renders at
          0,0 in the capture instead of inheriting the off-screen offset. */}
      <div aria-hidden="true" className="pointer-events-none" style={{ position: "fixed", left: -10000, top: 0 }}>
        <div
          ref={shareRef}
          style={{
            width: 720,
            padding: 32,
            position: "relative",
            backgroundColor: "#0a0d12",
            backgroundImage:
              "radial-gradient(circle at 12% 0, #1d293d 0 20%, transparent 42%), linear-gradient(135deg, #0a0d12, #171922 55%, #0e1219)",
          }}
        >
          {/* Same subtle grid overlay as the app background (body::before) */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.18,
              pointerEvents: "none",
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0 22px, rgba(255,255,255,0.06) 22px 23px), repeating-linear-gradient(0deg, transparent 0 17px, rgba(255,255,255,0.04) 17px 18px)",
            }}
          />
          <div
            className="relative flex flex-col rounded-2xl border border-rule p-8"
            style={{ backgroundColor: "#0f1218" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-black uppercase tracking-wider text-gold">
                Puntrlytics
              </span>
              <span className="rounded-full border border-rule bg-ticket px-3 py-1 font-utility text-xs font-bold uppercase tracking-wider text-faint">
                {providerName}
              </span>
            </div>
            <span className="mt-2 font-utility text-xs uppercase tracking-wider text-faint">
              Performance Report • {dayjs(savedAt).format("MMM D, YYYY")}
            </span>

            <div className={`mt-10 font-mono text-[56px] font-black leading-none ${isPos ? "text-lime" : "text-rose"}`}>
              <Money value={report.netProfit} currency={currency} signed />
            </div>
            <div className="mt-2 font-utility text-sm font-black uppercase tracking-[2px] text-ink">
              {isPos ? "Net Profit" : "Net Loss"}
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-rule bg-ticket p-5">
                <span className="block font-utility text-[11px] font-bold uppercase tracking-[1.5px] text-ink">ROI</span>
                <span className={`mt-1.5 block font-mono text-2xl font-black ${isRoiPos ? "text-lime" : "text-rose"}`}>
                  {isRoiPos ? "+" : ""}{report.roi.toFixed(1)}%
                </span>
              </div>
              <div className="rounded-xl border border-rule bg-ticket p-5">
                <span className="block font-utility text-[11px] font-bold uppercase tracking-[1.5px] text-ink">Total Stakes</span>
                <span className="mt-1.5 block font-mono text-2xl font-black text-ink"><Money value={report.totalStakes} currency={currency} /></span>
              </div>
              <div className="rounded-xl border border-rule bg-ticket p-5">
                <span className="block font-utility text-[11px] font-bold uppercase tracking-[1.5px] text-ink">Total Payouts</span>
                <span className="mt-1.5 block font-mono text-2xl font-black text-ink"><Money value={report.totalPayouts} currency={currency} /></span>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-rule/60 pt-4">
              <span className="font-mono text-[11px] text-faint">
                {report.period.first || report.period.last
                  ? `${report.period.first ? dayjs(report.period.first).format("MMM D, YYYY") : "?"} — ${report.period.last ? dayjs(report.period.last).format("MMM D, YYYY") : "?"}`
                  : ""}
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gold">
                100% in-browser • Puntrlytics
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents

function StatCard({ title, value, subtitle, colorClass = "text-ink" }: { title: string; value: React.ReactNode; subtitle?: string; colorClass?: string }) {
  return (
    <div className="group flex flex-col gap-1 justify-center rounded-md bg-background p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(247,185,85,0.08)] hover:border-gold/40">
      <span className="mb-2 font-utility text-xs font-medium uppercase tracking-[1.5px] text-ink">
        {title}
      </span>
      <span className={`font-mono text-2xl font-black ${colorClass}`}>{value}</span>
      {subtitle && <span className="mt-2 text-xs text-faint">{subtitle}</span>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-rule bg-background p-5 shadow-lg">
      <h3 className="mb-4 font-utility text-sm font-bold uppercase tracking-[1px] text-faint">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BreakdownTable({ title, data, currency }: { title: string; data: BreakdownBucket[]; currency: string }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col rounded-xl border border-rule bg-background shadow-lg overflow-hidden">
      <div className="border-b border-rule bg-background px-5 py-4">
        <h3 className="font-utility text-sm font-bold uppercase tracking-[1px] text-ink">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs text-faint">
          <thead>
            <tr className="border-b border-rule/50">
              <th className="px-4 py-3 font-normal uppercase tracking-wider text-ink">Category</th>
              <th className="px-4 py-3 text-right font-normal uppercase tracking-wider text-ink">Bets</th>
              <th className="px-4 py-3 text-right font-normal uppercase tracking-wider text-ink">Stake</th>
              <th className="px-4 py-3 text-right font-normal uppercase tracking-wider text-ink">Profit</th>
              <th className="px-4 py-3 text-right font-normal uppercase tracking-wider text-ink">ROI</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const isPos = row.profit >= 0;
              return (
                <tr key={i} className="border-b border-rule/20 last:border-0 hover:bg-ticket2/30">
                  <td className="px-4 py-3 text-ink">{row.label}</td>
                  <td className="px-4 py-3 text-right">{row.total}</td>
                  <td className="px-4 py-3 text-right">{fmtMoney(row.stake, currency)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${isPos ? "text-lime" : "text-rose"}`}>
                    {fmtMoney(row.profit, currency, true)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${isPos ? "text-lime" : "text-rose"}`}>
                    {isPos ? "+" : ""}{row.roi.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
