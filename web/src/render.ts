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
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right tabular-nums">${b.total}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right tabular-nums">${pct(b.winPct)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right tabular-nums">${fmtMoney(b.stake, cur)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right tabular-nums ${colorClass[pCol]}">${fmtMoney(b.profit, cur, true)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2.5 text-right tabular-nums ${colorClass[pCol]}">${signed(b.roi)}</td>
      </tr>`;
    })
    .join("");

  return `<div class="${sectionCard}">${sectionHeader(title)}
    <div class="-m-1 overflow-x-auto"><table class="w-full min-w-[680px] border-collapse text-[13.5px]">
      <thead><tr>
        <th class="border-b border-rule px-2.5 py-2 text-left font-utility text-[11px] uppercase tracking-[1.1px] text-faint">${esc(firstCol)}</th>
        <th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Bets</th>
        <th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Win rate</th>
        <th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Total staked</th>
        <th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Net profit</th>
        <th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">ROI</th>
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
const sectionTitleBase =
  "mb-3.5 font-utility text-xs uppercase tracking-[1.5px] text-faint";
function sectionHeader(title: string): string {
  return `<h2 class="${sectionTitleBase}">${title}</h2>`;
}
const kpiCard =
  "min-h-[122px] overflow-hidden rounded-lg border border-rule border-b-[5px] bg-gradient-to-b from-ticket to-ticket2 p-3.5 transition motion-safe:hover:-translate-y-0.5";
const kpiLabel =
  "mb-2.5 font-utility text-[11px] uppercase tracking-[1.3px] text-faint";
const kpiField = "pt-2 tabular-nums";
const kpiValue =
  "break-words font-display text-[clamp(21px,3vw,32px)] font-black leading-none tabular-nums";
const hint = "mt-1.5 text-[11px] text-faint";
const colorClass: Record<string, string> = {
  green: "text-lime",
  red: "text-rose",
  blue: "text-cyan",
  amber: "text-gold",
  "": "",
};

// Compact axis labels for the equity curve (currency-agnostic: +12.5k, −1.2M).
function compact(n: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  const sign = n > 0 ? "+" : "−";
  if (abs >= 1_000_000)
    return sign + (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + "M";
  if (abs >= 1_000)
    return sign + (abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1) + "k";
  return sign + Math.round(abs).toString();
}

// Cumulative profit "equity curve" — a self-contained inline SVG line/area
// chart of running net profit over the analyzed period (no chart library).
function equityCurve(report: Report, cur: string): string {
  const days = report.timeline;
  if (days.length < 2) return "";

  const cum: number[] = [];
  let acc = 0;
  for (const d of days) {
    acc += d.profit;
    cum.push(acc);
  }

  const W = 720;
  const H = 200;
  const padL = 10;
  const padR = 10;
  const padT = 18;
  const padB = 8;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const lo = Math.min(0, ...cum);
  const hi = Math.max(0, ...cum);
  const span = hi - lo || 1;

  const x = (i: number): number =>
    padL + (days.length === 1 ? innerW / 2 : (i / (days.length - 1)) * innerW);
  const y = (v: number): number => padT + ((hi - v) / span) * innerH;

  const pts = cum.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const zeroY = y(0).toFixed(1);
  const finalVal = cum[cum.length - 1];
  const up = finalVal >= 0;
  const stroke = up ? "#41d484" : "#ff7084";

  const areaPath =
    `M ${pts[0]} ` +
    pts
      .slice(1)
      .map((p) => `L ${p}`)
      .join(" ") +
    ` L ${x(days.length - 1).toFixed(1)},${zeroY} L ${x(0).toFixed(1)},${zeroY} Z`;
  const linePath = `M ${pts.join(" L ")}`;

  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => {
      const gy = (padT + t * innerH).toFixed(1);
      const val = hi - t * span;
      return (
        `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="rgba(242,238,228,0.08)" stroke-width="1"/>` +
        `<text x="${W - padR - 4}" y="${(parseFloat(gy) - 4).toFixed(1)}" text-anchor="end" font-size="10" fill="rgba(154,164,182,0.9)">${esc(compact(val))}</text>`
      );
    })
    .join("");

  const dots = cum
    .map((v, i) => {
      const cx = x(i).toFixed(1);
      const cy = y(v).toFixed(1);
      return i === cum.length - 1
        ? `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${stroke}"/><circle cx="${cx}" cy="${cy}" r="8.5" fill="none" stroke="${stroke}" stroke-opacity="0.35" stroke-width="1.5"/>`
        : `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${stroke}" fill-opacity="0.85"/>`;
    })
    .join("");

  const firstDate = days[0].date;
  const lastDate = days[days.length - 1].date;

  return `<div class="${sectionCard}">${sectionHeader("Profit curve — cumulative")}
    <div class="mb-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div>
        <div class="font-display text-[clamp(26px,4vw,40px)] font-black leading-none tabular-nums ${up ? "text-lime" : "text-rose"}">${fmtMoney(finalVal, cur, true)}</div>
        <div class="${hint}">running net profit across ${days.length} active day${days.length === 1 ? "" : "s"}</div>
      </div>
      <div class="text-right font-mono text-[10px] uppercase tracking-[1px] text-faint">${esc(firstDate)} → ${esc(lastDate)}</div>
    </div>
    <svg viewBox="0 0 ${W} ${H}" class="block w-full" role="img" aria-label="Cumulative profit curve from ${esc(firstDate)} to ${esc(lastDate)}, ending at ${fmtMoney(finalVal, cur, true)}">
      <defs>
        <linearGradient id="ba-equity-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${stroke}" stop-opacity="0.26"/>
          <stop offset="1" stop-color="${stroke}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${grid}
      <line x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}" stroke="rgba(242,238,228,0.22)" stroke-width="1"/>
      <path d="${areaPath}" fill="url(#ba-equity-fill)"/>
      <path d="${linePath}" fill="none" stroke="${stroke}" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
    </svg>
    <div class="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[1px] text-faint">
      <span>${esc(firstDate)}</span>
      <span>${esc(lastDate)}</span>
    </div>
    <div class="${hint}">Each dot is a day's closing balance; the line tracks cumulative profit/loss over the analyzed period.</div>
  </div>`;
}

export function renderReport(report: Report, opts: RenderOptions): string {
  const cur = opts.currency || "NGN";
  const c = report.counts;
  const genAt = opts.generatedAt || new Date().toLocaleString();
  const hasData = report.timeline.length > 0 || report.settledTotal > 0;
  const equityBlock = equityCurve(report, cur);

  // --- KPI cards (receipt-style fields) -------------------------
  const kpi = (
    label: string,
    value: string,
    valueCls = "",
    extra = "",
    cardCls = "",
  ): string =>
    `<div class="${kpiCard} ${cardCls}"><div class="${kpiLabel}">${label}</div>` +
    `<div class="${kpiField}"><div class="${kpiValue} ${valueCls}">${value}</div>${extra}</div></div>`;

  const kpis = `
    ${kpi("Total Stakes", fmtMoney(report.totalStakes, cur), "", "", "max-[860px]:col-span-2 max-[560px]:col-auto")}
    ${kpi("Total Payouts", fmtMoney(report.totalPayouts, cur))}
    ${kpi("Net Profit / Loss", fmtMoney(report.netProfit, cur, true), report.netProfit >= 0 ? "text-lime" : "text-rose")}
    ${kpi("ROI", signed(report.roi, 2), report.roi >= 0 ? "text-lime" : "text-rose", `<div class="${hint}">settled bets only</div>`)}
    ${kpi("Win Rate", report.winRate.toFixed(2) + "%", "", `<div class="${hint}">${c.Won} won / ${report.settledTotal} settled</div>`)}`;

  // --- status chips (stamped tags with a coloured left edge) ----
  const chipDefs: Array<[string, string, string]> = [
    ["Won", "green", "border-l-lime"],
    ["Lost", "red", "border-l-rose"],
    ["Void", "", "border-l-rule"],
    ["Open", "blue", "border-l-cyan"],
    ["Unknown", "amber", "border-l-gold"],
  ];
  const chips = chipDefs
    .map(
      ([label, cls, edge]) =>
        `<span class="whitespace-nowrap rounded-md border border-rule border-l-[3px] ${edge} bg-blacktop px-3 py-2.5 text-center text-[13px] font-extrabold tabular-nums ${colorClass[cls]}">${label}: ${c[label] || 0}</span>`,
    )
    .join("");

  // --- odds range table ------------------------------------------
  const rows = report.odds
    .map((d) => {
      const pCol = d.profit >= 0 ? "green" : "red";
      return `<tr>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-left">${esc(d.label)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right tabular-nums">${d.total}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right tabular-nums">${pct(d.winPct)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right tabular-nums">${fmtMoney(d.stake, cur)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right tabular-nums ${colorClass[pCol]}">${fmtMoney(d.profit, cur, true)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-3 text-right tabular-nums ${colorClass[pCol]}">${signed(d.roi)}</td>
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
      // Accessible description of the bar (visible text is elsewhere on the row).
      const barLabel =
        d.date +
        ": " +
        fmtMoney(d.profit, cur, true) +
        " across " +
        d.total +
        " bet" +
        (d.total === 1 ? "" : "s");
      const posBar =
        d.profit > 0
          ? `<i class="absolute top-0 bottom-0 rounded-sm bg-lime" style="left:50%;width:${barW.toFixed(1)}%"></i>`
          : "";
      const negBar =
        d.profit < 0
          ? `<i class="absolute top-0 bottom-0 rounded-sm bg-rose" style="right:50%;width:${barW.toFixed(1)}%"></i>`
          : "";
      // The tiny uppercase prefix shows only on phones, where the column
      // header row is hidden — so each figure still has a label.
      const mLabel = (t: string): string =>
        `<span class="hidden max-[560px]:inline font-utility text-[9px] uppercase tracking-[1px] text-faint/70">${t}&nbsp;</span>`;
      return `<div class="grid grid-cols-[110px_56px_minmax(120px,1fr)_110px_64px] items-center gap-3 border-b border-faint/15 py-2.5 last:border-b-0 max-[560px]:grid-cols-[1fr_1fr_auto] max-[560px]:gap-x-2.5 max-[560px]:gap-y-1.5">
        <div class="text-[13px] font-extrabold">${esc(d.date)}</div>
        <div class="whitespace-nowrap text-right text-xs text-faint tabular-nums max-[560px]:text-left">${mLabel("Bets")}${d.total} bet${d.total === 1 ? "" : "s"}</div>
        <div class="relative h-3 rounded border border-faint/20 bg-blacktop max-[560px]:col-span-full" role="img" aria-label="${esc(barLabel)}">
          <i class="absolute left-1/2 top-0 bottom-0 w-px bg-faint/40"></i>${posBar}${negBar}
        </div>
        <div class="whitespace-nowrap text-right text-xs font-bold tabular-nums ${colorClass[pCol]}">${mLabel("Net")}${fmtMoney(d.profit, cur, true)}</div>
        <div class="whitespace-nowrap text-right text-xs text-faint tabular-nums ${colorClass[pCol]}">${mLabel("ROI")}${signed(d.roi)}</div>
      </div>`;
    })
    .join("");

  const trendsBlock = days.length
    ? `<div class="${sectionCard}">${sectionHeader("Daily trends — last " + days.length + " active days")}
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
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2 text-right tabular-nums ${colorClass[pCol]}">${fmtMoney(h.netProfit, cur, true)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2 text-right tabular-nums ${colorClass[pCol]}">${signed(h.roi)}</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2 text-right tabular-nums">${h.winRate.toFixed(2)}%</td>
        <td class="whitespace-nowrap border-b border-faint/15 px-2.5 py-2 text-right tabular-nums text-faint">${h.settledTotal}</td>
      </tr>`;
    })
    .join("");

  const historyBlock = history.length
    ? `<div class="${sectionCard}">${sectionHeader("Saved snapshots (this browser)")}
       <div class="-m-1 overflow-x-auto"><table class="w-full min-w-[560px] border-collapse text-[13px]">
         <thead><tr>
           <th class="border-b border-rule px-2.5 py-2 text-left font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Saved</th>
           <th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Net profit</th>
           <th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">ROI</th>
           <th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Win rate</th>
           <th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Settled</th>
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
    <div class="rounded-lg border border-rule bg-blacktop p-3.5"><div class="mb-1.5 font-utility text-[11px] uppercase tracking-[1.2px] text-faint">Biggest win</div><div class="break-words font-display text-[26px] font-black text-lime tabular-nums">${fmtMoney(report.biggestWin.payout, cur)}</div><div class="${hint}">${winDate || "-"}</div></div>
    <div class="rounded-lg border border-rule bg-blacktop p-3.5"><div class="mb-1.5 font-utility text-[11px] uppercase tracking-[1.2px] text-faint">Biggest loss</div><div class="break-words font-display text-[26px] font-black text-rose tabular-nums">${fmtMoney(report.biggestLoss.stake, cur)}</div><div class="${hint}">${lossDate || "-"}</div></div>`;

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
  <header class="mb-[22px] grid grid-cols-[minmax(0,1fr)_auto] items-end gap-[18px] border-b border-rule pb-[16px] max-[860px]:grid-cols-1">
    <h1 class="font-display text-[clamp(34px,6vw,76px)] font-black uppercase leading-[.9]"><span class="text-gold">Bet</span> Analyzer</h1>
    <span class="max-w-[360px] text-right font-mono text-[11px] uppercase tracking-[1.1px] text-faint max-[860px]:text-left">№ ${esc(opts.providerName)} / ${report.totalBets} bet${report.totalBets === 1 ? "" : "s"}${period ? " / " + esc(period) : ""} / ${cur} / local</span>
  </header>
  ${
    hasData
      ? `<section class="mb-[18px] grid grid-cols-5 gap-2.5 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">${kpis}</section>
  ${equityBlock}
  <section class="${sectionCard}">${sectionHeader("Highlights")}<div class="grid grid-cols-2 gap-2.5 max-[560px]:grid-cols-1">${highlights}</div></section>
  <section class="${sectionCard}">${sectionHeader("Status breakdown")}<div class="grid grid-cols-5 gap-2 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">${chips}</div></section>
  <section class="${sectionCard}">${sectionHeader("Performance by odds range")}
    <div class="-m-1 overflow-x-auto"><table class="w-full min-w-[680px] border-collapse text-[13.5px]">
      <thead><tr><th class="border-b border-rule px-2.5 py-2 text-left font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Odds range</th><th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Bets</th><th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Win rate</th><th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Total staked</th><th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">Net profit</th><th class="border-b border-rule px-2.5 py-2 text-right font-utility text-[11px] uppercase tracking-[1.1px] text-faint">ROI</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </section>
  ${betTypeSection}
  ${sportSection}
  ${tournamentSection}
  ${stakeSection}
  ${trendsBlock}`
      : `<div class="${sectionCard}"><div class="mb-1.5 font-utility text-[11px] uppercase tracking-[1.2px] text-faint">No report yet</div>
    <p class="text-[13.5px] leading-relaxed text-faint">No bets could be analyzed from this page. Make sure you're <b>logged in</b> and running the bookmarklet from your <b>Bet History</b> page, then run it again. Your data never leaves your browser.</p></div>`
  }
  ${historyBlock}
  <footer class="mx-auto mt-[30px] max-w-[680px] text-center">
    <div class="font-mono text-[10px] uppercase tracking-[1px] text-faint/80">generated ${esc(genAt)} · processed entirely in your browser</div>
    <p class="mt-1.5 text-xs text-faint">A snapshot of each run is saved to this site's localStorage (on your device only) so you can revisit it after closing this tab.</p>
  </footer>
</div>
</body>
</html>`;
}
