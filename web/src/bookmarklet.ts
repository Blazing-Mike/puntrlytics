// Bookmarklet runner — shared by every provider entry.
// Fetches the user's bets, computes the report, and opens the
// dashboard in a new blank tab (fully self-contained HTML).

import { computeReport, type Provider } from "./core";
import { renderReport } from "./render";

export function runBookmarklet(provider: Provider): void {
  // Floating progress toast on the site we're running against.
  const overlay = document.createElement("div");
  overlay.setAttribute(
    "style",
    [
      "position:fixed", "top:16px", "right:16px", "z-index:2147483647",
      "background:#0f1420", "color:#e5e7eb", "font:13px/1.5 system-ui,sans-serif",
      "padding:14px 18px", "border-radius:10px", "box-shadow:0 8px 30px rgba(0,0,0,.35)",
      "max-width:320px", "border:1px solid #1f2937",
    ].join(";"),
  );
  overlay.innerHTML =
    '<div style="font-weight:700;margin-bottom:4px;color:#10b981">⚡ Bet Analyzer</div>' +
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

  provider
    .fetchBets(msg)
    .then((bets) => {
      if (!bets || bets.length === 0) {
        throw new Error("No bets found — are you logged in and on the Bet History page?");
      }
      msg("Analyzing " + bets.length + " bets…");
      const report = computeReport(bets);
      const html = renderReport(report, {
        providerName: provider.name,
        currency: provider.currency,
      });

      const w = window.open("", "_blank");
      if (!w) {
        throw new Error("Popup blocked — please allow popups for this site and try again.");
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      cleanup();
    })
    .catch((err: unknown) => fail(err));
}
