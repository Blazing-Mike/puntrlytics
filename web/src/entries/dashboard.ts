// Browser runtime for the hosted /dashboard page.
//
// Flow:
//   1. The bookmarklet opens  https://<host>/dashboard#<encoded-report>
//      (same browser, so this is where persistence actually lives).
//   2. This script reads the fragment, saves the report to localStorage on
//      THIS origin (betlytics domain — not the bookmaker's), and renders it.
//   3. On later direct visits to /dashboard there's no fragment, so it loads
//      the saved reports from localStorage and shows the latest + a history
//      list.

import { fmtMoney } from "../core";
import { renderReport } from "../render";
import {
  deleteReport,
  loadReports,
  newReportId,
  saveReport,
  type StoredReport,
} from "../report-store";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const AVATAR_COLORS = [
  "#f7b955",
  "#41d484",
  "#5fd4ff",
  "#ff7084",
  "#b39dff",
  "#ffb25f",
  "#4dd8c0",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initial(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

function renderStats(reports: StoredReport[]): void {
  const el = document.getElementById("ba-stats");
  const foot = document.getElementById("ba-foot-count");
  if (foot) {
    foot.textContent = reports.length ? reports.length + " saved" : "0 saved";
  }
  if (!el) return;
  if (!reports.length) {
    el.innerHTML = "";
    return;
  }
  const total = reports.reduce((s, r) => s + r.report.netProfit, 0);
  const bestRoi = Math.max(...reports.map((r) => r.report.roi));
  const tCls = total >= 0 ? "ba-pos" : "ba-neg";
  const rCls = bestRoi >= 0 ? "ba-pos" : "ba-neg";
  el.innerHTML =
    '<div class="ba-stat"><div class="ba-stat-label">Reports</div><div class="ba-stat-value">' +
    reports.length +
    "</div></div>" +
    '<div class="ba-stat"><div class="ba-stat-label">Net profit</div><div class="ba-stat-value ' +
    tCls +
    '">' +
    fmtMoney(total, reports[0].currency, true) +
    "</div></div>" +
    '<div class="ba-stat"><div class="ba-stat-label">Best ROI</div><div class="ba-stat-value ' +
    rCls +
    '">' +
    (bestRoi >= 0 ? "+" : "") +
    bestRoi.toFixed(1) +
    "%</div></div>";
}

function clearFrame(): void {
  const frame = document.getElementById("ba-frame") as HTMLIFrameElement | null;
  if (frame) frame.srcdoc = "";
}

function renderList(reports: StoredReport[], selectedId: string | null): void {
  const listEl = document.getElementById("ba-list");
  if (!listEl) return;

  if (!reports.length) {
    listEl.innerHTML =
      '<div class="ba-empty"><div class="ba-empty-mark">∅</div>' +
      "No saved reports yet.<br/><br/>" +
      "Open <b>SportyBet</b> or <b>football.com</b>, run the Bet Analyzer " +
      "bookmarklet, and your report will appear here.</div>";
    return;
  }

  listEl.innerHTML =
    '<div class="ba-list-title">History</div>' +
    reports
      .map((r) => {
        const profit = r.report.netProfit;
        const cls = profit >= 0 ? "ba-pos" : "ba-neg";
        const active = r.id === selectedId ? " ba-active" : "";
        return (
          '<div class="ba-row' +
          active +
          '" data-id="' +
          esc(r.id) +
          '">' +
          '<button type="button" class="ba-row-btn">' +
          '<span class="ba-avatar" style="background:' +
          avatarColor(r.providerName) +
          '">' +
          esc(initial(r.providerName)) +
          "</span>" +
          '<span class="ba-row-meta">' +
          '<span class="ba-row-prov">' +
          esc(r.providerName) +
          "</span>" +
          '<span class="ba-row-date">' +
          esc(r.savedAt) +
          "</span>" +
          "</span>" +
          '<span class="ba-row-nums">' +
          '<span class="ba-row-profit ' +
          cls +
          '">' +
          fmtMoney(profit, r.currency, true) +
          "</span>" +
          '<span class="ba-row-roi ' +
          cls +
          '">' +
          (r.report.roi >= 0 ? "+" : "") +
          r.report.roi.toFixed(1) +
          "%</span>" +
          "</span>" +
          "</button>" +
          '<button type="button" class="ba-row-del" aria-label="Delete ' +
          esc(r.providerName) +
          '" title="Delete">×</button>' +
          "</div>"
        );
      })
      .join("");

  listEl.querySelectorAll<HTMLButtonElement>(".ba-row-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".ba-row") as HTMLElement | null;
      const id = row?.getAttribute("data-id") || "";
      const r = reports.find((x) => x.id === id);
      if (r) {
        renderList(reports, id);
        renderReportInto(r);
      }
    });
  });

  listEl.querySelectorAll<HTMLButtonElement>(".ba-row-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".ba-row") as HTMLElement | null;
      const id = row?.getAttribute("data-id") || "";
      if (!id) return;
      const remaining = deleteReport(id);
      renderStats(remaining);
      const next = remaining[0] || null;
      renderList(remaining, next ? next.id : null);
      if (next) renderReportInto(next);
      else clearFrame();
    });
  });
}

function renderReportInto(r: StoredReport): void {
  const frame = document.getElementById("ba-frame") as HTMLIFrameElement | null;
  if (!frame) return;
  frame.srcdoc = renderReport(r.report, {
    providerName: r.providerName,
    currency: r.currency,
    generatedAt: r.savedAt,
  });
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function init(): void {
  let reports = loadReports();
  renderStats(reports);

  // New report handed over via the URL fragment.
  if (location.hash && location.hash.length > 1) {
    try {
      const payload = JSON.parse(
        decodeURIComponent(location.hash.slice(1)),
      ) as Partial<StoredReport>;
      if (payload && payload.report) {
        const incoming: StoredReport = {
          id: newReportId(),
          providerName: String(payload.providerName || "Bookmaker"),
          currency: String(payload.currency || "NGN"),
          savedAt: formatSavedAt(String(payload.savedAt || "")),
          report: payload.report,
        };
        reports = saveReport(incoming);
        // Clean the URL so refreshing doesn't re-import the same data.
        history.replaceState(null, "", location.pathname + location.search);
        renderStats(reports);
        renderList(reports, incoming.id);
        renderReportInto(incoming);
        return;
      }
    } catch {
      /* ignore malformed fragment and fall through to the saved list */
    }
  }

  renderList(reports, null);
  if (reports.length) renderReportInto(reports[0]);
}

init();
