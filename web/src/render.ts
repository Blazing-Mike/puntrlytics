// Renders a self-contained HTML dashboard from a computed Report.
// No external assets — everything (CSS + markup) is inlined so the
// report can be written into a blank popup tab by the bookmarklet.

import { fmtMoney, type Report } from "./core";

export interface RenderOptions {
  providerName: string;
  currency: string;
  generatedAt?: string;
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

const CSS = `
:root{--bg:#0b1020;--panel:#121a2e;--panel2:#0e1526;--border:#1f2a45;--text:#e7edf7;--muted:#8fa0c2;--green:#10b981;--red:#f43f5e;--blue:#3b82f6;--amber:#f59e0b}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.5;padding:32px 20px 60px}
.wrap{max-width:880px;margin:0 auto}
header{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:24px}
header h1{font-size:22px;font-weight:800;letter-spacing:.3px}
header h1 .zap{color:var(--green)}
header .sub{color:var(--muted);font-size:13px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
.kpi{background:linear-gradient(180deg,var(--panel),var(--panel2));border:1px solid var(--border);border-radius:14px;padding:16px}
.kpi .label{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:6px}
.kpi .value{font-size:20px;font-weight:800}
.card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:20px}
.card h2{font-size:14px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:14px}
.hint{font-size:11px;color:var(--muted);margin-top:4px}
.green{color:var(--green)}.red{color:var(--red)}.blue{color:var(--blue)}.amber{color:var(--amber)}
.chips{display:flex;gap:10px;flex-wrap:wrap}
.chip{border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600;border:1px solid var(--border)}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:right;padding:6px 8px;border-bottom:1px solid var(--border)}
th:first-child,td:first-child{text-align:left}
td{padding:9px 8px;border-bottom:1px solid var(--border);text-align:right;white-space:nowrap}
tr:last-child td{border-bottom:none}
.hl{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.hl .box{background:var(--panel2);border:1px solid var(--border);border-radius:10px;padding:12px}
.hl .box .t{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
.hl .box .value{font-size:18px;font-weight:800;margin-bottom:2px}
.day{display:grid;grid-template-columns:110px 70px 1fr 130px;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)}
.day:last-child{border-bottom:none}
.day .d{font-weight:600;font-size:13px}
.day .m{color:var(--muted);font-size:12px;text-align:right}
.bar{height:10px;border-radius:99px;background:#1b2540;overflow:hidden}
.bar i{display:block;height:100%;border-radius:99px}
footer{color:var(--muted);font-size:12px;text-align:center;margin-top:28px;max-width:640px;margin-left:auto;margin-right:auto}
@media(max-width:560px){.day{grid-template-columns:90px 56px 1fr 104px}.kpis{grid-template-columns:1fr 1fr}}
`;

export function renderReport(report: Report, opts: RenderOptions): string {
  const cur = opts.currency || "NGN";
  const c = report.counts;
  const genAt = opts.generatedAt || new Date().toLocaleString();
  const hasData = report.timeline.length > 0 || report.settledTotal > 0;

  // --- KPI cards -------------------------------------------------
  const kpis = `
    <div class="kpi"><div class="label">Total Stakes</div><div class="value">${fmtMoney(report.totalStakes, cur)}</div></div>
    <div class="kpi"><div class="label">Total Payouts</div><div class="value">${fmtMoney(report.totalPayouts, cur)}</div></div>
    <div class="kpi"><div class="label">Net Profit / Loss</div><div class="value ${report.netProfit >= 0 ? "green" : "red"}">${fmtMoney(report.netProfit, cur, true)}</div></div>
    <div class="kpi"><div class="label">ROI</div><div class="value ${report.roi >= 0 ? "green" : "red"}">${signed(report.roi, 2)}</div><div class="hint">settled bets only</div></div>
    <div class="kpi"><div class="label">Win Rate</div><div class="value">${report.winRate.toFixed(2)}%</div><div class="hint">${c.Won} won / ${report.settledTotal} settled</div></div>`;

  // --- status chips ----------------------------------------------
  const chipDefs: Array<[string, string]> = [
    ["Won", "green"],
    ["Lost", "red"],
    ["Void", ""],
    ["Open", "blue"],
    ["Unknown", "amber"],
  ];
  const chips = chipDefs
    .map(([label, cls]) => `<span class="chip ${cls}">${label}: ${c[label] || 0}</span>`)
    .join("");

  // --- odds range table ------------------------------------------
  const rows = report.odds
    .map((d) => {
      const pCol = d.profit >= 0 ? "green" : "red";
      return `<tr>
        <td>${esc(d.label)}</td>
        <td>${d.total}</td>
        <td>${pct(d.winPct)}</td>
        <td>${fmtMoney(d.stake, cur)}</td>
        <td class="${pCol}">${fmtMoney(d.profit, cur, true)}</td>
        <td class="${pCol}">${signed(d.roi)}</td>
      </tr>`;
    })
    .join("");

  // --- daily trends ----------------------------------------------
  const days = report.timeline.slice(0, 7);
  const maxAbs = Math.max(1, ...days.map((d) => Math.abs(d.profit)));
  const dayRows = days
    .map((d) => {
      const barW = Math.max(2, (Math.abs(d.profit) / maxAbs) * 100);
      const barColor = d.profit > 0 ? "var(--green)" : d.profit < 0 ? "var(--red)" : "#475569";
      const pCol = d.profit >= 0 ? "green" : "red";
      return `<div class="day">
        <div class="d">${esc(d.date)}</div>
        <div class="m">${d.total} bet${d.total === 1 ? "" : "s"}</div>
        <div class="bar"><i style="width:${barW.toFixed(1)}%;background:${barColor}"></i></div>
        <div class="m ${pCol}">${fmtMoney(d.profit, cur, true)}</div>
      </div>`;
    })
    .join("");

  const trendsBlock = days.length
    ? `<div class="card"><h2>Daily trends — last ${days.length} active days</h2>
       ${dayRows}
       <div class="hint">Bar width scales with the day's net profit.</div></div>`
    : "";

  // --- highlights ------------------------------------------------
  const winDate = report.biggestWin.date ? ` · ${esc(report.biggestWin.date)}` : "";
  const lossDate = report.biggestLoss.date ? ` · ${esc(report.biggestLoss.date)}` : "";
  const highlights = `
    <div class="box"><div class="t">Biggest win</div><div class="value green">${fmtMoney(report.biggestWin.payout, cur)}</div><div class="hint">${winDate || "—"}</div></div>
    <div class="box"><div class="t">Biggest loss</div><div class="value red">${fmtMoney(report.biggestLoss.stake, cur)}</div><div class="hint">${lossDate || "—"}</div></div>`;

  // --- assemble --------------------------------------------------
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bet Analyzer — ${esc(opts.providerName)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1><span class="zap">⚡</span> Bet Analyzer</h1>
    <span class="sub">${esc(opts.providerName)} · generated ${esc(genAt)} · nothing was uploaded</span>
  </header>
  ${
    hasData
      ? `<section class="kpis">${kpis}</section>
  <section class="card"><h2>Highlights</h2><div class="hl">${highlights}</div></section>
  <section class="card"><h2>Status breakdown</h2><div class="chips">${chips}</div></section>
  <section class="card"><h2>Performance by odds range</h2>
    <table>
      <thead><tr><th>Odds range</th><th>Bets</th><th>Win rate</th><th>Total staked</th><th>Net profit</th><th>ROI</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>
  ${trendsBlock}`
      : `<div class="card">No bets found to analyze.</div>`
  }
  <footer>🔒 Your bets were processed entirely in your browser and were never uploaded or stored anywhere. Built with ⚡ Bet Analyzer.</footer>
</div>
</body>
</html>`;
}
