// Renders a self-contained HTML dashboard from a computed Report.
// No external assets — everything (CSS + markup) is inlined so the
// report can be written into a blank popup tab by the bookmarklet.

import { fmtMoney, type BreakdownBucket, type Report } from "./core";

export interface RenderOptions {
  providerName: string;
  currency: string;
  generatedAt?: string;
  /** Previously saved reports for the same provider (newest first). */
  history?: SavedRunInfo[];
}

export interface SavedRunInfo {
  providerName: string;
  savedAt: string;
  totalStakes: number;
  totalPayouts: number;
  netProfit: number;
  roi: number;
  winRate: number;
  settledTotal: number;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pct(n: number): string {
  return n.toFixed(1) + "%";
}

function signed(n: number, digits = 1): string {
  return (n >= 0 ? "+" : "") + n.toFixed(digits) + "%";
}

// Generic per-category performance table (bet type, sport, tournament, stake).
function breakdownSection(
  title: string,
  firstCol: string,
  buckets: BreakdownBucket[],
  cur: string,
): string {
  const list = buckets.filter((b) => b.total > 0);
  if (!list.length) return "";
  const rows = list
    .map((b) => {
      const pCol = b.profit > 0 ? "green" : b.profit < 0 ? "red" : "";
      return `<tr>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-left">${esc(b.label)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right">${b.total}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right">${pct(b.winPct)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right">${fmtMoney(b.stake, cur)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right ${colorClass[pCol]}">${fmtMoney(b.profit, cur, true)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right ${colorClass[pCol]}">${signed(b.roi)}</td>
      </tr>`;
    })
    .join("");

  return `<div class="${sectionCard}"><h2 class="${sectionTitle}">${title}</h2>
    <div class="-m-1 overflow-x-auto"><table class="w-full min-w-[680px] border-collapse text-[13.5px]">
      <thead><tr>
        <th class="border-b border-dashed border-rule px-2.5 py-2 text-left font-utility text-[11px] uppercase tracking-[1.1px] text-faint">${esc(firstCol)}</th>
        <th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Bets</th>
        <th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Win rate</th>
        <th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Total staked</th>
        <th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Net profit</th>
        <th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">ROI</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}

declare const __BET_ANALYZER_CSS__: string;

const CSS = __BET_ANALYZER_CSS__;
const page = "relative mx-auto max-w-[1040px]";
const sectionCard =
  "mb-[18px] rounded-lg border border-rule bg-ticket/90 p-3.5 shadow-[0_18px_46px_rgba(0,0,0,.18)] sm:p-[18px]";
const sectionTitle =
  "mb-3.5 flex items-center gap-2.5 font-utility text-xs uppercase tracking-[1.5px] text-faint before:block before:w-8 before:border-t before:border-dashed before:border-gold";
const kpiCard =
  "min-h-[122px] overflow-hidden rounded-lg border border-b-[5px] border-rule bg-gradient-to-b from-ticket to-ticket2 p-3.5 transition motion-safe:hover:-translate-y-0.5";
const kpiLabel =
  "mb-3 font-utility text-[11px] uppercase tracking-[1.3px] text-faint";
const kpiValue =
  "break-words font-display text-[clamp(21px,3vw,32px)] font-black leading-none";
const hint = "mt-1.5 text-[11px] text-faint";
const colorClass: Record<string, string> = {
  green: "text-lime",
  red: "text-rose",
  blue: "text-cyan",
  amber: "text-gold",
  "": "",
};

export function renderReport(report: Report, opts: RenderOptions): string {
  const cur = opts.currency || "NGN";
  const c = report.counts;
  const genAt = opts.generatedAt || new Date().toLocaleString();
  const hasData = report.timeline.length > 0 || report.settledTotal > 0;

  // --- KPI cards -------------------------------------------------
  const kpis = `
    <div class="${kpiCard} max-[860px]:first:col-span-2 max-[560px]:first:col-auto"><div class="${kpiLabel}">Total Stakes</div><div class="${kpiValue}">${fmtMoney(report.totalStakes, cur)}</div></div>
    <div class="${kpiCard}"><div class="${kpiLabel}">Total Payouts</div><div class="${kpiValue}">${fmtMoney(report.totalPayouts, cur)}</div></div>
    <div class="${kpiCard}"><div class="${kpiLabel}">Net Profit / Loss</div><div class="${kpiValue} ${report.netProfit >= 0 ? "text-lime" : "text-rose"}">${fmtMoney(report.netProfit, cur, true)}</div></div>
    <div class="${kpiCard}"><div class="${kpiLabel}">ROI</div><div class="${kpiValue} ${report.roi >= 0 ? "text-lime" : "text-rose"}">${signed(report.roi, 2)}</div><div class="${hint}">settled bets only</div></div>
    <div class="${kpiCard}"><div class="${kpiLabel}">Win Rate</div><div class="${kpiValue}">${report.winRate.toFixed(2)}%</div><div class="${hint}">${c.Won} won / ${report.settledTotal} settled</div></div>`;

  // --- status chips ----------------------------------------------
  const chipDefs: Array<[string, string]> = [
    ["Won", "green"],
    ["Lost", "red"],
    ["Void", ""],
    ["Open", "blue"],
    ["Unknown", "amber"],
  ];
  const chips = chipDefs
    .map(
      ([label, cls]) =>
        `<span class="whitespace-nowrap rounded-md border border-rule bg-blacktop px-3 py-2.5 text-center text-[13px] font-extrabold ${colorClass[cls]}">${label}: ${c[label] || 0}</span>`,
    )
    .join("");

  // --- odds range table ------------------------------------------
  const rows = report.odds
    .map((d) => {
      const pCol = d.profit >= 0 ? "green" : "red";
      return `<tr>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-left">${esc(d.label)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right">${d.total}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right">${pct(d.winPct)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right">${fmtMoney(d.stake, cur)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right ${colorClass[pCol]}">${fmtMoney(d.profit, cur, true)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right ${colorClass[pCol]}">${signed(d.roi)}</td>
      </tr>`;
    })
    .join("");

  // --- daily trends ----------------------------------------------
  // timeline is chronological (oldest → newest) from computeReport, so the
  // last N entries are the most recent active days, shown left-to-right/old→new.
  const days = report.timeline.slice(-7);
  const maxAbs = Math.max(1, ...days.map((d) => Math.abs(d.profit)));
  const dayRows = days
    .map((d) => {
      // Zero-anchored bar: half-width on each side of the centre line.
      const barW = Math.max(1, (Math.abs(d.profit) / maxAbs) * 50);
      const pCol = d.profit > 0 ? "green" : d.profit < 0 ? "red" : "";
      const posBar =
        d.profit > 0
          ? `<i class="absolute top-0 bottom-0 rounded-sm bg-[var(--green)]" style="left:50%;width:${barW.toFixed(1)}%"></i>`
          : "";
      const negBar =
        d.profit < 0
          ? `<i class="absolute top-0 bottom-0 rounded-sm bg-[var(--red)]" style="right:50%;width:${barW.toFixed(1)}%"></i>`
          : "";
      return `<div class="grid grid-cols-[110px_56px_minmax(120px,1fr)_110px_64px] items-center gap-3 border-b border-faint/15 py-2.5 last:border-b-0 max-[560px]:grid-cols-[1fr_1fr_auto] max-[560px]:gap-x-2.5 max-[560px]:gap-y-1.5">
        <div class="text-[13px] font-extrabold">${esc(d.date)}</div>
        <div class="whitespace-nowrap text-right text-xs text-faint max-[560px]:text-left">${d.total} bet${d.total === 1 ? "" : "s"}</div>
        <div class="relative h-3 rounded border border-faint/20 bg-blacktop max-[560px]:col-span-full">
          <i class="absolute left-1/2 top-0 bottom-0 w-px bg-faint/40"></i>${posBar}${negBar}
        </div>
        <div class="whitespace-nowrap text-right text-xs font-bold ${colorClass[pCol]}">${fmtMoney(d.profit, cur, true)}</div>
        <div class="whitespace-nowrap text-right text-xs text-faint ${colorClass[pCol]}">${signed(d.roi)}</div>
      </div>`;
    })
    .join("");

  const trendsBlock = days.length
    ? `<div class="${sectionCard}"><h2 class="${sectionTitle}">Daily trends - last ${days.length} active days</h2>
       <div class="mb-1 grid grid-cols-[110px_56px_minmax(120px,1fr)_110px_64px] gap-3 px-0 font-utility text-[10px] uppercase tracking-[1px] text-faint max-[560px]:hidden">
         <div>Date</div><div class="text-right">Bets</div><div class="text-center">Profit / loss</div><div class="text-right">Net</div><div class="text-right">ROI</div>
       </div>
       ${dayRows}
       <div class="${hint}">Green = profit (right of centre), red = loss (left). Bar length scales with the biggest day; ROI uses settled bets only.</div></div>`
    : "";

  // --- saved history (persisted on the bookmaker's domain) -------
  const history = opts.history || [];
  const historyRows = history
    .map((h) => {
      const pCol = h.netProfit >= 0 ? "green" : "red";
      return `<tr>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2 text-left text-faint">${esc(h.savedAt)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2 text-right ${colorClass[pCol]}">${fmtMoney(h.netProfit, cur, true)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2 text-right ${colorClass[pCol]}">${signed(h.roi)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2 text-right">${h.winRate.toFixed(2)}%</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2 text-right text-faint">${h.settledTotal}</td>
      </tr>`;
    })
    .join("");

  const historyBlock = history.length
    ? `<div class="${sectionCard}"><h2 class="${sectionTitle}">Saved snapshots (this browser)</h2>
       <div class="-m-1 overflow-x-auto"><table class="w-full min-w-[560px] border-collapse text-[13px]">
         <thead><tr>
           <th class="border-b border-dashed border-rule px-2.5 py-2 text-left font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Saved</th>
           <th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Net profit</th>
           <th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">ROI</th>
           <th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Win rate</th>
           <th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Settled</th>
         </tr></thead>
         <tbody>${historyRows}</tbody>
       </table></div>
       <div class="${hint}">Stored in this site's localStorage — it survives closing the page. Run the bookmarklet again to add a new snapshot.</div></div>`
    : "";

  // --- highlights ------------------------------------------------
  const winDate = report.biggestWin.date
    ? ` · ${esc(report.biggestWin.date)}`
    : "";
  const lossDate = report.biggestLoss.date
    ? ` · ${esc(report.biggestLoss.date)}`
    : "";
  const highlights = `
    <div class="rounded-lg border border-rule bg-blacktop p-3.5"><div class="mb-1.5 font-utility text-[11px] uppercase tracking-[1.2px] text-faint">Biggest win</div><div class="break-words font-display text-[26px] font-black text-lime">${fmtMoney(report.biggestWin.payout, cur)}</div><div class="${hint}">${winDate || "-"}</div></div>
    <div class="rounded-lg border border-rule bg-blacktop p-3.5"><div class="mb-1.5 font-utility text-[11px] uppercase tracking-[1.2px] text-faint">Biggest loss</div><div class="break-words font-display text-[26px] font-black text-rose">${fmtMoney(report.biggestLoss.stake, cur)}</div><div class="${hint}">${lossDate || "-"}</div></div>`;

  // --- new breakdown sections (quick wins) -----------------------
  const betTypeSection = breakdownSection(
    "Singles vs multiples",
    "Type",
    report.betTypes,
    cur,
  );
  const sportSection = breakdownSection(
    "Performance by sport",
    "Sport",
    report.bySport,
    cur,
  );
  const tournamentSection = breakdownSection(
    "Performance by tournament",
    "Tournament",
    report.byTournament,
    cur,
  );
  const stakeSection = breakdownSection(
    "Performance by stake size",
    "Stake",
    report.stakeBuckets,
    cur,
  );

  // Report period (first → last bet date) for the header line.
  const period =
    report.period && report.period.first
      ? report.period.first +
        (report.period.last && report.period.last !== report.period.first
          ? " → " + report.period.last
          : "")
      : "";

  // --- assemble --------------------------------------------------
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bet Analyzer - ${esc(opts.providerName)}</title>
<style>${CSS}</style>
</head>
<body class="px-[18px] pb-14 pt-7 max-[560px]:px-3 max-[560px]:pb-11 max-[560px]:pt-5">
<div class="${page}">
  <header class="mb-[22px] grid grid-cols-[minmax(0,1fr)_auto] items-end gap-[18px] pb-[18px] max-[860px]:grid-cols-1">
    <h1 class="font-display text-[clamp(34px,6vw,76px)] font-black uppercase leading-[.9]"><span class="text-gold">Bet</span> Analyzer</h1>
    <span class="max-w-[360px] text-right font-utility text-xs uppercase tracking-[1.4px] text-faint max-[860px]:text-left">${esc(opts.providerName)} / ${report.totalBets} bet${report.totalBets === 1 ? "" : "s"}${period ? " / " + esc(period) : ""} / generated ${esc(genAt)} / processed locally</span>
  </header>
  ${
    hasData
      ? `<section class="mb-[18px] grid grid-cols-5 gap-2.5 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">${kpis}</section>
  <section class="${sectionCard}"><h2 class="${sectionTitle}">Highlights</h2><div class="grid grid-cols-2 gap-2.5 max-[560px]:grid-cols-1">${highlights}</div></section>
  <section class="${sectionCard}"><h2 class="${sectionTitle}">Status breakdown</h2><div class="grid grid-cols-5 gap-2 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">${chips}</div></section>
  <section class="${sectionCard}"><h2 class="${sectionTitle}">Performance by odds range</h2>
    <div class="-m-1 overflow-x-auto"><table class="w-full min-w-[680px] border-collapse text-[13.5px]">
      <thead><tr><th class="border-b border-dashed border-rule px-2.5 py-2 text-left font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Odds range</th><th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Bets</th><th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Win rate</th><th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Total staked</th><th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Net profit</th><th class="border-b border-dashed border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">ROI</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </section>
  ${betTypeSection}
  ${sportSection}
  ${tournamentSection}
  ${stakeSection}
  ${trendsBlock}`
      : `<div class="${sectionCard}">No bets found to analyze.</div>`
  }
  ${historyBlock}
  <footer class="mx-auto mt-[30px] max-w-[680px] text-center text-xs text-faint">Processed entirely in your browser. A snapshot of each run is saved to this site's localStorage (on your device only) so you can revisit it after closing this tab.</footer>
</div>
</body>
</html>`;
}
