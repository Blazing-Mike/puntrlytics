/**
 * FOOTBALL.COM BET HISTORY SCRAPER — API VERSION
 * ------------------------------------------------------------------
 * The Bet History page loads new bets via a JSON API as you scroll
 * (there is no "Next" button). This script calls that same API
 * directly with fetch(), reusing your logged-in session cookies, so
 * it works without clicking anything.
 *
 * INSTRUCTIONS:
 * 1. Log in to https://www.football.com
 * 2. Open your Bet History page:
 *    https://www.football.com/ng/n/my_accounts/open_bets/bet_history
 * 3. Press F12 -> Console.
 * 4. Paste this entire script and press Enter.
 *
 * WHAT IT DOES:
 *   A) PROBE   — calls the API with no params and with the site's own
 *                filter params, prints the response shape in the
 *                console, and saves both responses to api_probe.json.
 *   B) COLLECT — fetches every page automatically (tries a large
 *                pageSize first, then auto-detects the page parameter),
 *                normalizes each bet, and downloads bets_raw.json.
 *
 * If the extracted bets look wrong, share the api_probe.json file (or
 * this console output) and the field/status mapping below can be tuned.
 * ------------------------------------------------------------------
 */

(async function () {
  "use strict";

  // The JSON API the Bet History page uses. `pageSize` is stripped on
  // purpose — we control it ourselves during collection.
  const API_BASE = "https://www.football.com/api/ng/orders/order/v2/realbetlist";

  // Filters the site's UI sends on the Bet History page. Keep them so we
  // get the same list you see in the browser. Adjust if your page shows a
  // different tab (e.g. open bets).
  const BASE_PARAMS = {
    isSettled: "10",
    onlyWinnings: "0",
    isHistory: "0",
  };

  // Candidate parameter names the API might use for pagination.
  const PAGE_PARAM_CANDIDATES = [
    "page", "pageNum", "pageNo", "pageNumber", "currentPage", "pageIndex",
    "offset", "start", "skip",
  ];
  const SIZE_PARAM_CANDIDATES = ["pageSize", "limit", "size", "rows"];
  const MAX_PAGES = 100;
  const PAGE_DELAY_MS = 300; // be polite to the server

  // --- small helpers ----------------------------------------------------

  const log = (msg, color = "#4CAF50") =>
    console.log(`%c[Bet Scraper] ${msg}`, `color: ${color}; font-weight: bold;`);
  const warn = (msg) => console.warn(`[Bet Scraper] ${msg}`);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const download = (filename, data) => {
    const blob = new Blob(
      [typeof data === "string" ? data : JSON.stringify(data, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  async function fetchJson(params) {
    const url = new URL(API_BASE);
    for (const [k, v] of Object.entries(params || {})) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
    const res = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json, text/plain, */*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return JSON.parse(await res.text());
  }

  // --- response-shape discovery ----------------------------------------

  // Recursively find the first array of "bet-like" objects in the response.
  function findBetsArray(obj, depth = 0, path = "root") {
    if (depth > 8 || obj === null || typeof obj !== "object") return null;
    if (
      Array.isArray(obj) &&
      obj.length > 0 &&
      typeof obj[0] === "object" &&
      obj[0] !== null
    ) {
      const keys = Object.keys(obj[0]).map((k) => k.toLowerCase());
      const betLike = keys.some((k) =>
        /stake|odds|amount|bet|win|return|payout|order|ticket|rate/.test(k),
      );
      if (betLike) return { arr: obj, path };
    }
    for (const [key, val] of Object.entries(obj)) {
      const found = findBetsArray(val, depth + 1, `${path}.${key}`);
      if (found) return found;
    }
    return null;
  }

  // Look for a total-record-count anywhere in the response.
  function findTotal(obj, depth = 0) {
    if (depth > 6 || obj === null || typeof obj !== "object") return null;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const t = findTotal(item, depth + 1);
        if (t) return t;
      }
      return null;
    }
    for (const [k, v] of Object.entries(obj)) {
      if (
        typeof v === "number" &&
        /^(total|totalcount|count|recordcount|totalnum|totalnumber|totalrecords?)$/i.test(k) &&
        v > 0
      ) {
        return v;
      }
      const t = findTotal(v, depth + 1);
      if (t) return t;
    }
    return null;
  }

  function summarize(label, json) {
    if (json && typeof json === "object" && !Array.isArray(json)) {
      log(`${label} — top-level keys: ${Object.keys(json).join(", ") || "(none)"}`, "#2196F3");
    }
    const found = findBetsArray(json);
    if (found) {
      log(
        `${label} — bets array found at '${found.path}' with ${found.arr.length} item(s)`,
        "#2196F3",
      );
      console.log(`[Bet Scraper] First record keys: ${Object.keys(found.arr[0]).join(", ")}`);
      console.log("[Bet Scraper] First record:", found.arr[0]);
    } else {
      warn(`${label} — could not locate a bets array automatically.`);
    }
  }

  // --- bet normalization ------------------------------------------------

  const pick = (obj, keys) => {
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
  };

  const toNum = (v) => {
    if (v === undefined || v === null || v === "") return 0;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  function parseDate(v) {
    if (v === undefined || v === null || v === "") return "";
    if (typeof v === "number") {
      // epoch millis vs epoch seconds
      const ms = v > 1e12 ? v : v * 1000;
      return new Date(ms).toISOString().replace("T", " ").substring(0, 19);
    }
    const s = String(v);
    const iso = s.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/);
    if (iso) return iso[0];
    const slash = s.match(/\d{2}\/\d{2}\/\d{4}/);
    if (slash) return slash[0];
    const num = Number(s);
    if (Number.isFinite(num) && num > 1e9) {
      return new Date(num > 1e12 ? num : num * 1000).toISOString().replace("T", " ").substring(0, 19);
    }
    return s;
  }

  // Maps the API's status field to the analyzer's Won/Lost/Void/Open.
  // football.com uses winningStatus codes: 20 = Won, 30 = Lost, 10 = Void,
  // 40 = Open (per-selection `status` uses 1 = won, 2 = lost). If you see
  // "Unknown" statuses, check api_probe.json and adjust the map below.
  function mapStatus(raw) {
    const lower = {};
    for (const [k, v] of Object.entries(raw)) lower[k.toLowerCase()] = v;

    // If the API gives an explicit win flag, trust it first.
    const winFlag = lower.iswin ?? lower.iswinloss ?? lower.iswinflag;
    if (typeof winFlag === "boolean") return winFlag ? "Won" : "Lost";
    if (winFlag === 1 || winFlag === "1" || winFlag === "Y" || winFlag === "true") return "Won";
    if (winFlag === 0 || winFlag === "0" || winFlag === "N" || winFlag === "false") return "Lost";

    const status = pick(lower, [
      "winningstatus", "status", "orderstatus", "betstatus", "state",
      "winloss", "result", "statusname", "statustext",
    ]);
    if (typeof status === "string") {
      const s = status.toLowerCase();
      if (/won|win|success|paid|winner/.test(s)) return "Won";
      if (/lost|lose|fail|loss/.test(s)) return "Lost";
      if (/void|cancel|refund|invalid|draw/.test(s)) return "Void";
      if (/open|pending|running|active|unsettled|wait/.test(s)) return "Open";
      return "Unknown";
    }
    if (typeof status === "number") {
      const num = Number(status);
      // football.com order-level codes
      if (num === 20) return "Won";
      if (num === 30) return "Lost";
      if (num === 10) return "Void";
      if (num === 40) return "Open";
      // fallback guesses for other systems / per-selection codes
      if (num === 1) return "Won";
      if (num === 2 || num === 0) return "Lost";
      if (num === 3 || num === -1) return "Void";
      if (num === 4 || num === 5) return "Open";
      warn(`Unseen numeric status code '${status}' — mapped to Unknown. Check api_probe.json.`);
      return "Unknown";
    }
    return "Unknown";
  }

  function normalizeBet(raw) {
    const lower = {};
    for (const [k, v] of Object.entries(raw)) lower[k.toLowerCase()] = v;

    // football.com has no order-level odds field — the total odds of an
    // accumulator is the product of its selections' odds.
    let odds = toNum(pick(lower, [
      "totalodds", "odds", "odd", "rate", "multiple", "bonus", "oddsvalue",
    ]));
    if (!odds && Array.isArray(raw.selections) && raw.selections.length > 0) {
      const selOdds = raw.selections
        .map((s) => toNum(s && s.odds))
        .filter((o) => o > 0);
      if (selOdds.length > 0) odds = selOdds.reduce((a, b) => a * b, 1);
    }

    return {
      betId: String(
        pick(lower, [
          "orderno", "orderid", "betno", "ticketno", "ticketid", "betid",
          "id", "refno", "serialno",
        ]) ?? "",
      ),
      date: parseDate(
        pick(lower, [
          "createtime", "createdate", "bettime", "ordertime", "createdtime",
          "addtime", "settletime", "date",
        ]),
      ),
      stake: toNum(pick(lower, [
        "stakeamount", "stake", "betamount", "amount", "stakemoney",
        "wager", "totalstake", "money",
      ])),
      payout: toNum(pick(lower, [
        "returnamount", "winamount", "payout", "return", "winmoney",
        "profitamount", "earnamount", "winning", "totalwinnings",
      ])),
      odds,
      status: mapStatus(raw),
      rawText: JSON.stringify(raw).slice(0, 150),
    };
  }

  // --- collection --------------------------------------------------------

  function normalizeAndCollect(arr, seen) {
    let added = 0;
    for (const item of arr) {
      const bet = normalizeBet(item);
      const key = bet.betId || `${bet.date}|${bet.stake}|${bet.odds}|${bet.status}`;
      if (!seen.has(key)) {
        seen.set(key, bet);
        added++;
      }
    }
    return added;
  }

  async function collectAll(probe) {
    const seen = new Map();
    const first = findBetsArray(probe);
    const total = findTotal(probe);
    const firstArr = first ? first.arr : [];

    const added = normalizeAndCollect(firstArr, seen);
    log(`Probe returned ${firstArr.length} raw record(s) — ${seen.size} unique bet(s).`, "#2196F3");
    if (total) log(`Server reports ${total} record(s) total.`, "#2196F3");

    if (total && seen.size >= total) return [...seen.values()];

    // 1) Try grabbing everything in one request with a big page size.
    let sizeName = "pageSize";
    for (const candidate of SIZE_PARAM_CANDIDATES) {
      try {
        const big = await fetchJson({ ...BASE_PARAMS, [candidate]: 1000 });
        const arr = findBetsArray(big)?.arr || [];
        const newAdded = normalizeAndCollect(arr, seen);
        if (arr.length > firstArr.length) {
          sizeName = candidate;
          log(
            `Large request (${candidate}=1000) returned ${arr.length} record(s). Running total: ${seen.size}.`,
            "#2196F3",
          );
          if (total && seen.size >= total) return [...seen.values()];
        } else if (newAdded === 0 && arr.length > 0) {
          log(`${candidate} ignored by the server (same records returned).`, "#FF9800");
        }
      } catch {
        /* candidate param not supported; try the next one */
      }
      await sleep(150);
    }

    // 2) Auto-detect the page parameter by comparing page 1 vs page 2.
    let pageParam = null;
    let pageBase = 1;
    let pageStep = 1;
    for (const p of PAGE_PARAM_CANDIDATES) {
      const offsetStyle = p === "offset" || p === "start" || p === "skip";
      const v1 = offsetStyle ? 0 : 1;
      const v2 = offsetStyle ? 10 : 2;
      try {
        const r1 = await fetchJson({ ...BASE_PARAMS, [p]: v1, [sizeName]: 10 });
        const r2 = await fetchJson({ ...BASE_PARAMS, [p]: v2, [sizeName]: 10 });
        const a1 = (findBetsArray(r1)?.arr || []).map((b) => normalizeBet(b).betId).filter(Boolean);
        const a2 = (findBetsArray(r2)?.arr || []).map((b) => normalizeBet(b).betId).filter(Boolean);
        if (a1.length > 0 && a2.length > 0 && !a2.some((id) => a1.includes(id))) {
          pageParam = p;
          pageBase = v1;
          pageStep = offsetStyle ? 10 : 1;
          log(`Pagination detected: '${p}' (page ${v1} -> ${v2} returns different bets).`, "#2196F3");
          break;
        }
      } catch {
        /* param not supported; try the next one */
      }
      await sleep(150);
    }

    // 3) Fetch remaining pages.
    if (pageParam) {
      const pageSize = total ? Math.min(100, Math.max(total, 1)) : 100;
      let value = pageBase;
      for (let i = 0; i < MAX_PAGES; i++) {
        const res = await fetchJson({ ...BASE_PARAMS, [pageParam]: value, [sizeName]: pageSize });
        const arr = findBetsArray(res)?.arr || [];
        const newAdded = normalizeAndCollect(arr, seen);
        log(
          `Request ${i + 1} (${pageParam}=${value}, ${sizeName}=${pageSize}): ${arr.length} record(s), ${newAdded} new. Total: ${seen.size}.`,
          "#2196F3",
        );
        if (arr.length === 0 || newAdded === 0) break;
        if (total && seen.size >= total) break;
        value += pageStep;
        await sleep(PAGE_DELAY_MS);
      }
    } else if (total && seen.size < total) {
      warn(
        "Could not auto-detect the page parameter. api_probe.json has been downloaded — share its contents and I can finish the mapping.",
      );
    }

    return [...seen.values()];
  }

  // --- main --------------------------------------------------------------

  try {
    log("Starting... probing the API first.", "#FF9800");

    let probeNoParams = null;
    try {
      probeNoParams = await fetchJson({});
      log("Probe #1 (no params) succeeded.", "#2196F3");
    } catch (err) {
      warn(`Probe #1 failed: ${err.message}`);
    }

    let probe = null;
    try {
      probe = await fetchJson(BASE_PARAMS);
      log("Probe #2 (site's filter params) succeeded.", "#2196F3");
    } catch (err) {
      warn(`Probe #2 failed: ${err.message}`);
      if (!probeNoParams) {
        warn(
          "Both probes failed — make sure you are logged in and on the Bet History page (the script must run on football.com so it is same-origin).",
        );
        return;
      }
      probe = probeNoParams;
    }

    if (probeNoParams) summarize("Probe #1 (no params)", probeNoParams);
    if (probe) summarize("Probe #2 (with filters)", probe);

    log("Saving both probe responses to api_probe.json.", "#FF9800");
    download("api_probe.json", {
      probeNoParams,
      probeWithFilters: probe,
      note: "If the collected bets look wrong, share this file (or the console output) to fix the field/status mapping.",
    });

    const bets = await collectAll(probe);

    if (bets.length === 0) {
      warn("No bets extracted. Check the console output above and api_probe.json.");
      return;
    }

    const statusCounts = {};
    for (const b of bets) {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    }
    log(`Extracted ${bets.length} bet(s). Status distribution: ${JSON.stringify(statusCounts)}`);

    download("bets_raw.json", bets);
    log(
      `SUCCESS! ${bets.length} bet(s) saved to bets_raw.json. Run 'npm start' to analyze.`,
      "#4CAF50",
    );
  } catch (err) {
    console.error("[Bet Scraper] Unexpected error:", err);
  }
})();
