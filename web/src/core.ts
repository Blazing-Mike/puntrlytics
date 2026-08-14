// Shared analysis core — single source of truth for the metrics math.
// Used by the bookmarklet bundle (browser) and the build/demo pipeline (Node).

// Bump this whenever bookmarklet behavior changes so users can confirm they
// reinstalled the latest build (it's printed to the console + toast).
export const BA_VERSION = "2.1.0";

export interface Bet {
  betId: string;
  date: string;
  stake: number;
  payout: number;
  odds: number;
  status: string;
}

export interface OddsBucket {
  key: string;
  label: string;
  stake: number;
  profit: number;
  won: number;
  total: number;
  winPct: number;
  roi: number;
}

export interface DaySummary {
  date: string;
  stake: number;
  payout: number;
  profit: number;
  won: number;
  total: number;
}

export interface BetHighlight {
  payout: number;
  stake: number;
  date: string;
  betId: string;
}

export interface Report {
  counts: Record<string, number>;
  totalStakes: number;
  totalPayouts: number;
  netProfit: number;
  roi: number;
  winRate: number;
  settledTotal: number;
  odds: OddsBucket[];
  timeline: DaySummary[];
  biggestWin: BetHighlight;
  biggestLoss: BetHighlight;
}

export interface Provider {
  id: string;
  name: string;
  currency: string;
  fetchBets(progress?: (msg: string) => void): Promise<Bet[]>;
}

export type Params = Record<string, string | number | undefined | null>;

// Normalize an API URL before fetching:
//   1. Resolve relative / protocol-relative paths against the page origin (so
//      the request stays same-origin with the logged-in session).
//   2. Drop an accidentally duplicated origin segment. Old/edited bookmarklet
//      builds could end up with a doubled URL like
//      "https://host/api/ng//host/api/ng/orders/..." — this collapses it back
//      to "https://host/api/ng/orders/...".
//   3. The bookmarklet is same-origin by design, so the final host is always
//      forced to the site you're currently on. This also corrects stale
//      bookmarklets that hardcoded a wrong/mangled host.
export function normalizeApiUrl(baseUrl: string, origin?: string): string {
  const pageOrigin =
    origin || (typeof location !== "undefined" ? location.origin : "");
  let u = String(baseUrl).trim();
  if (!/^[a-z][a-z0-9+.\-]*:/i.test(u)) {
    u = new URL(u, pageOrigin || undefined).href;
  }
  const parsed = new URL(u);
  const host = parsed.hostname.toLowerCase();

  const segs = parsed.pathname.split("/");
  const dup = segs.findIndex((s) => {
    const l = s.toLowerCase();
    return l === host || l === "www." + host;
  });
  if (dup >= 0) parsed.pathname = "/" + segs.slice(dup + 1).join("/");

  if (pageOrigin) {
    const page = new URL(pageOrigin);
    if (parsed.origin !== page.origin) {
      return page.origin + parsed.pathname + parsed.search;
    }
  }
  return parsed.href;
}

// Fetch JSON from the same origin (uses the logged-in session cookies).
export function fetchJson(
  baseUrl: string,
  params?: Params,
  init?: RequestInit,
): Promise<unknown> {
  const url = new URL(normalizeApiUrl(baseUrl));
  for (const k in params || {}) {
    const v = (params as Params)[k];
    if (v !== undefined && v !== null && v !== "")
      url.searchParams.set(k, String(v));
  }
  // Always log the exact URL we're about to request — makes it easy to spot a
  // stale bookmarklet (doubled path / double `_t`) in the console.
  console.log("[Bet Analyzer] GET " + url.href);
  return fetch(
    url,
    Object.assign(
      {
        credentials: "include",
        headers: { Accept: "application/json, text/plain, */*" },
      },
      init || {},
    ),
  ).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res.text().then((t) => JSON.parse(t) as unknown);
  });
}

// First present value among candidate keys.
export function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// Coerce a number/string ("1,234.50", "₦300.00") to a number.
export function toNum(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n =
    typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Parse dates: epoch millis/seconds, ISO strings, d/m/Y strings.
export function parseDate(v: unknown): string {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "number") {
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
    return new Date(num > 1e12 ? num : num * 1000)
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
  }
  return s;
}

export const currencySymbol: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "GH₵",
  KES: "KSh",
  ZAR: "R",
};

// Format money: symbol + thousands separators, max 2 decimals. `signed`
// prefixes "+" on positive values (for profit/ROI figures).
export function fmtMoney(n: number, currency: string, signed = false): string {
  const sym = currencySymbol[currency] || "₦";
  const s = n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (signed && n > 0 ? "+" : "") + sym + s;
}

// --- report computation --------------------------------------
// Mirrors the math in the CLI analyzer (analyze.js) exactly.

export function computeReport(bets: Bet[]): Report {
  let totalStakes = 0;
  let totalPayouts = 0;
  let settledStakes = 0;
  let settledNetProfit = 0;

  const counts: Record<string, number> = {
    Won: 0,
    Lost: 0,
    Void: 0,
    Open: 0,
    Unknown: 0,
  };

  const odds: OddsBucket[] = [
    {
      key: "low",
      label: "Low Odds (< 1.50)",
      stake: 0,
      profit: 0,
      won: 0,
      total: 0,
      winPct: 0,
      roi: 0,
    },
    {
      key: "med",
      label: "Medium (1.50 - 2.50)",
      stake: 0,
      profit: 0,
      won: 0,
      total: 0,
      winPct: 0,
      roi: 0,
    },
    {
      key: "high",
      label: "High (2.50 - 5.00)",
      stake: 0,
      profit: 0,
      won: 0,
      total: 0,
      winPct: 0,
      roi: 0,
    },
    {
      key: "exotic",
      label: "Exotic (5.00+)",
      stake: 0,
      profit: 0,
      won: 0,
      total: 0,
      winPct: 0,
      roi: 0,
    },
  ];

  const timeline: Record<string, DaySummary> = {};

  let biggestWin: BetHighlight = { payout: 0, stake: 0, date: "", betId: "" };
  let biggestLoss: BetHighlight = { payout: 0, stake: 0, date: "", betId: "" };

  for (const bet of bets) {
    const stake = toNum(bet.stake);
    const payout = toNum(bet.payout);
    const o = toNum(bet.odds) || 1.0;
    const status = bet.status || "Unknown";
    const profit =
      status === "Won" ? payout - stake : status === "Lost" ? -stake : 0;

    totalStakes += stake;
    totalPayouts += payout;

    if (counts[status] !== undefined) counts[status]++;
    else counts.Unknown++;

    if (status === "Won" || status === "Lost") {
      settledStakes += stake;
      settledNetProfit += profit;
    }

    // Odds bucket
    const cat =
      o < 1.5 ? "low" : o <= 2.5 ? "med" : o <= 5.0 ? "high" : "exotic";
    const d =
      odds[cat === "low" ? 0 : cat === "med" ? 1 : cat === "high" ? 2 : 3];
    d.total++;
    d.stake += stake;
    d.profit += profit;
    if (status === "Won") d.won++;

    // Day bucket
    const rawDate = bet.date || "";
    const m =
      rawDate.match(/^\d{4}-\d{2}-\d{2}/) ||
      rawDate.match(/^\d{2}\/\d{2}\/\d{4}/);
    const dateKey = m ? m[0] : "Unknown Date";
    let t = timeline[dateKey];
    if (!t) {
      t = { date: dateKey, stake: 0, payout: 0, profit: 0, won: 0, total: 0 };
      timeline[dateKey] = t;
    }
    t.stake += stake;
    t.payout += payout;
    t.profit += profit;
    t.total++;
    if (status === "Won") t.won++;

    // Highlights
    if (status === "Won" && payout > biggestWin.payout) {
      biggestWin = {
        payout,
        stake,
        date: bet.date || "",
        betId: bet.betId || "",
      };
    }
    if (status === "Lost" && stake > biggestLoss.stake) {
      biggestLoss = {
        payout,
        stake,
        date: bet.date || "",
        betId: bet.betId || "",
      };
    }
  }

  const netProfit = totalPayouts - totalStakes;
  const settledTotal = counts.Won + counts.Lost;
  const winRate = settledTotal > 0 ? (counts.Won / settledTotal) * 100 : 0;
  const roi = settledStakes > 0 ? (settledNetProfit / settledStakes) * 100 : 0;

  for (const d of odds) {
    d.winPct = d.total > 0 ? (d.won / d.total) * 100 : 0;
    d.roi = d.stake > 0 ? (d.profit / d.stake) * 100 : 0;
  }

  const days = Object.keys(timeline)
    .map((k) => timeline[k])
    .sort((a, b) => {
      // Descending by date; "Unknown Date" sinks to the bottom.
      const da = a.date === "Unknown Date" ? "" : a.date;
      const db = b.date === "Unknown Date" ? "" : b.date;
      return da < db ? 1 : da > db ? -1 : 0;
    });

  return {
    counts,
    totalStakes,
    totalPayouts,
    netProfit,
    roi,
    winRate,
    settledTotal,
    odds,
    timeline: days,
    biggestWin,
    biggestLoss,
  };
}
