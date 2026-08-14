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

import { fmtMoney, type Report } from "../core";
import { renderReport } from "../render";

interface StoredReport {
  id: string;
  providerName: string;
  currency: string;
  savedAt: string;
  report: Report;
}

const KEY = "betlytics:reports";
const MAX_SAVED = 50;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function load(): StoredReport[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as StoredReport[]) : [];
  } catch {
    return [];
  }
}

function save(list: StoredReport[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_SAVED)));
  } catch {
    /* storage full / blocked — non-fatal */
  }
}

function renderList(reports: StoredReport[], selectedId: string | null): void {
  const listEl = document.getElementById("ba-list");
  if (!listEl) return;

  if (!reports.length) {
    listEl.innerHTML =
      '<div class="ba-empty">No saved reports yet.<br/><br/>' +
      "Open <b>SportyBet</b> or <b>football.com</b>, run the Bet Analyzer " +
      "bookmarklet, and your report will appear here.</div>";
    return;
  }

  listEl.innerHTML = reports
    .map((r) => {
      const profit = r.report.netProfit;
      const cls = profit >= 0 ? "ba-pos" : "ba-neg";
      const active = r.id === selectedId ? " ba-active" : "";
      return (
        '<button type="button" class="ba-row' +
        active +
        '" data-id="' +
        esc(r.id) +
        '">' +
        '<span class="ba-row-prov">' +
        esc(r.providerName) +
        "</span>" +
        '<span class="ba-row-date">' +
        esc(r.savedAt) +
        "</span>" +
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
        "</button>"
      );
    })
    .join("");

  listEl.querySelectorAll<HTMLButtonElement>(".ba-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id") || "";
      const r = reports.find((x) => x.id === id);
      if (r) {
        renderList(reports, id);
        renderReportInto(r);
      }
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
  let reports = load();

  // New report handed over via the URL fragment.
  if (location.hash && location.hash.length > 1) {
    try {
      const payload = JSON.parse(
        decodeURIComponent(location.hash.slice(1)),
      ) as Partial<StoredReport>;
      if (payload && payload.report) {
        const incoming: StoredReport = {
          id:
            "r" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 8),
          providerName: String(payload.providerName || "Bookmaker"),
          currency: String(payload.currency || "NGN"),
          savedAt: formatSavedAt(String(payload.savedAt || "")),
          report: payload.report,
        };
        reports = [incoming, ...reports].slice(0, MAX_SAVED);
        save(reports);
        // Clean the URL so refreshing doesn't re-import the same data.
        history.replaceState(null, "", location.pathname + location.search);
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
