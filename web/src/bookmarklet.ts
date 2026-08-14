// Bookmarklet runner — shared by every provider entry.
// Fetches the user's bets, computes the report, and opens the
// dashboard in a new blank tab (fully self-contained HTML).

import { BA_VERSION, computeReport, type Provider } from "./core";
import { renderReport, type SavedRunInfo } from "./render";

// Public host (injected at build time). When set, the bookmarklet opens the
// hosted /dashboard page with the report in the URL fragment, so the data is
// persisted on our own domain and survives closing the bookmaker's page.
declare const __BET_ANALYZER_HOST__: string;

// Snapshots are persisted to the bookmaker's own origin (localStorage) so the
// report data survives closing the popup tab. Keyed per provider.
const storageKey = (providerId: string): string =>
  "betAnalyzer:reports:" + providerId;
const MAX_SNAPSHOTS = 20;

function loadHistory(providerId: string): SavedRunInfo[] {
  try {
    const raw = localStorage.getItem(storageKey(providerId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveSnapshot(providerId: string, snap: SavedRunInfo): void {
  try {
    const arr = [snap, ...loadHistory(providerId)].slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(storageKey(providerId), JSON.stringify(arr));
  } catch {
    /* storage full / blocked — non-fatal */
  }
}

export function runBookmarklet(provider: Provider): void {
  // Version marker — check the console: if this line is missing (or shows an
  // older version), the browser is running a stale bookmarklet.
  console.log(
    "[Bet Analyzer] v" + BA_VERSION + " — " + provider.name + " (auto-detect)",
  );

  // Floating progress toast on the site we're running against.
  const overlay = document.createElement("div");
  overlay.setAttribute(
    "style",
    [
      "position:fixed",
      "top:16px",
      "right:16px",
      "z-index:2147483647",
      "background:#202938",
      "color:#f2eee4",
      "font:13px/1.5 system-ui,sans-serif",
      "padding:14px 18px",
      "border-radius:10px",
      "box-shadow:0 8px 30px rgba(0,0,0,.35)",
      "max-width:320px",
      "border:1px solid #374153",
    ].join(";"),
  );
  // Provider label right in the toast so you always know which site's data
  // is being read (SportyBet vs football.com) — useful with the auto-detect
  // bookmarklet that runs on both sites.
  const esc = (s: string): string =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  overlay.innerHTML =
    '<div style="font-weight:700;margin-bottom:4px;color:#41d484">⚡ Bet Analyzer — ' +
    esc(provider.name) +
    ' <span style="font-weight:400;opacity:.7">v' +
    BA_VERSION +
    "</span></div>" +
    '<div id="ba-msg" style="opacity:.85">Starting…</div>';
  document.body.appendChild(overlay);

  const msg = (t: string): void => {
    const m = document.getElementById("ba-msg");
    if (m) m.textContent = t;
  };
  const cleanup = (): void => {
    overlay.remove();
  };
  const fail = (err: unknown): void => {
    console.error("[Bet Analyzer]", err);
    const e = err instanceof Error ? err : new Error(String(err));
    msg("❌ " + e.message);
    window.setTimeout(cleanup, 12000);
  };

  msg("Reading " + provider.name + " bet history…");
  provider
    .fetchBets(msg)
    .then((bets) => {
      if (!bets || bets.length === 0) {
        throw new Error(
          "No bets found on " +
            provider.name +
            " — are you logged in and on the Bet History page?",
        );
      }
      msg("Analyzing " + bets.length + " bets…");
      const report = computeReport(bets);

      // Hosted dashboard: hand the report to /dashboard on our own domain
      // (same browser), which persists it to ITS localStorage. That makes the
      // data accessible at https://<host>/dashboard even after closing this
      // page — cross-origin localStorage can't be shared directly.
      if (__BET_ANALYZER_HOST__) {
        const payload = {
          providerName: provider.name,
          currency: provider.currency,
          savedAt: new Date().toISOString(),
          report,
        };
        const target =
          __BET_ANALYZER_HOST__ +
          "/dashboard.html#" +
          encodeURIComponent(JSON.stringify(payload));
        const w = window.open(target, "_blank");
        if (!w) {
          throw new Error(
            "Popup blocked — please allow popups for this site and try again.",
          );
        }
        cleanup();
        return;
      }

      // Fallback (no host configured): self-contained blank tab + snapshots
      // stored on the bookmaker's own origin.
      const history = loadHistory(provider.id);
      const html = renderReport(report, {
        providerName: provider.name,
        currency: provider.currency,
        history,
      });
      saveSnapshot(provider.id, {
        providerName: provider.name,
        savedAt: new Date().toLocaleString(),
        totalStakes: report.totalStakes,
        totalPayouts: report.totalPayouts,
        netProfit: report.netProfit,
        roi: report.roi,
        winRate: report.winRate,
        settledTotal: report.settledTotal,
      });

      const w = window.open("", "_blank");
      if (!w) {
        throw new Error(
          "Popup blocked — please allow popups for this site and try again.",
        );
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      cleanup();
    })
    .catch((err: unknown) => fail(err));
}
