"use client";

import { useMemo } from "react";
import { fmtMoney, type BreakdownBucket, type DaySummary } from "@/lib/core";
import type { StoredReport } from "@/lib/store";
import dayjs from "dayjs";
import { ProviderLogo } from "@/components/ProviderLogo";
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

export function ReportView({ reportData }: { reportData: StoredReport }) {
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

  return (
    <div className="flex h-full flex-col font-sans text-[var(--color-ink)]">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-rule)] bg-[var(--color-ticket2)]/80 px-8 py-5 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <ProviderLogo providerName={providerName} size={48} />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black uppercase text-[var(--color-gold)]">Performance Report</h1>
            <p className="font-utility text-xs tracking-wider text-[var(--color-faint)]">
              {providerName} • Generated {dayjs(savedAt).format("MMM D, YYYY h:mm A")}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="font-utility text-xs tracking-wider text-[var(--color-faint)] uppercase">
            Period
          </span>
          <span className="font-mono text-sm">
            {report.period.first ? dayjs(report.period.first).format("MMM D, YYYY") : "?"} — {report.period.last ? dayjs(report.period.last).format("MMM D, YYYY") : "?"}
          </span>
        </div>
      </header>

      <div className="flex-1 p-8 space-y-8 overflow-y-auto">
        {/* Top KPIs */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <StatCard title="Net Profit" value={fmtMoney(report.netProfit, currency, true)} colorClass={isPos ? "text-[var(--color-lime)]" : "text-[var(--color-rose)]"} />
          <StatCard title="ROI" value={`${isRoiPos ? "+" : ""}${report.roi.toFixed(1)}%`} colorClass={isRoiPos ? "text-[var(--color-lime)]" : "text-[var(--color-rose)]"} />
          <StatCard title="Win Rate" value={`${report.winRate.toFixed(1)}%`} />
          <StatCard title="Total Bets" value={report.totalBets.toLocaleString()} />
          <StatCard title="Settled Bets" value={report.settledTotal.toLocaleString()} />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard title="Total Stakes" value={fmtMoney(report.totalStakes, currency)} />
          <StatCard title="Total Payouts" value={fmtMoney(report.totalPayouts, currency)} />
        </section>

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
          <BreakdownTable title="Performance by Bet Type" data={report.betTypes} currency={currency} />
          <BreakdownTable title="Top Sports" data={report.bySport} currency={currency} />
        </section>
      </div>
    </div>
  );
}

// Subcomponents

function StatCard({ title, value, colorClass = "text-[var(--color-ink)]" }: { title: string; value: string; colorClass?: string }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-[var(--color-rule)] bg-[var(--color-ticket)] p-5 shadow-lg transition-transform hover:-translate-y-1">
      <span className="mb-2 font-utility text-xs font-bold uppercase tracking-[1.5px] text-[var(--color-faint)]">
        {title}
      </span>
      <span className={`font-mono text-2xl font-black ${colorClass}`}>{value}</span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--color-rule)] bg-[var(--color-ticket)] p-5 shadow-lg">
      <h3 className="mb-4 font-utility text-sm font-bold uppercase tracking-[1px] text-[var(--color-faint)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BreakdownTable({ title, data, currency }: { title: string; data: BreakdownBucket[]; currency: string }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="flex flex-col rounded-xl border border-[var(--color-rule)] bg-[var(--color-ticket)] shadow-lg overflow-hidden">
      <div className="border-b border-[var(--color-rule)] bg-[var(--color-ticket2)]/50 px-5 py-4">
        <h3 className="font-utility text-sm font-bold uppercase tracking-[1px] text-[var(--color-ink)]">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs text-[var(--color-faint)]">
          <thead>
            <tr className="border-b border-[var(--color-rule)]/50">
              <th className="px-4 py-3 font-normal uppercase tracking-wider text-[var(--color-ink)]">Category</th>
              <th className="px-4 py-3 text-right font-normal uppercase tracking-wider text-[var(--color-ink)]">Bets</th>
              <th className="px-4 py-3 text-right font-normal uppercase tracking-wider text-[var(--color-ink)]">Stake</th>
              <th className="px-4 py-3 text-right font-normal uppercase tracking-wider text-[var(--color-ink)]">Profit</th>
              <th className="px-4 py-3 text-right font-normal uppercase tracking-wider text-[var(--color-ink)]">ROI</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const isPos = row.profit >= 0;
              return (
                <tr key={i} className="border-b border-[var(--color-rule)]/20 last:border-0 hover:bg-[var(--color-ticket2)]/30">
                  <td className="px-4 py-3 text-[var(--color-ink)]">{row.label}</td>
                  <td className="px-4 py-3 text-right">{row.total}</td>
                  <td className="px-4 py-3 text-right">{fmtMoney(row.stake, currency)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${isPos ? "text-[var(--color-lime)]" : "text-[var(--color-rose)]"}`}>
                    {fmtMoney(row.profit, currency, true)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${isPos ? "text-[var(--color-lime)]" : "text-[var(--color-rose)]"}`}>
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
