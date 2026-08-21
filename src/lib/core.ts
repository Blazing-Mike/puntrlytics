// Shared analysis core — single source of truth for the metrics math.
// Used by the bookmarklet bundle (browser) and the build/demo pipeline (Node).

// Bump this whenever bookmarklet behavior changes so users can confirm they
// reinstalled the latest build (it's printed to the console + toast).
export const BA_VERSION = "1.0.0";

export interface Bet {
  betId: string;
  date: string;
  stake: number;
  payout: number;
  odds: number;
  status: string;
  /** "Single" | "Multiple" | "" (unknown) — derived from order/selection size. */
  betType?: string;
  /** Primary sport of the selections ("" unknown, "Mixed" if several). */
  sport?: string;
  /** Primary tournament/league of the selections ("" unknown, "Mixed"). */
  tournament?: string;
}

export interface OddsBucket {
  key: string;
  label: string;
  stake: number;
  profit: number;
  won: number;
  total: number;
  /** Settled (Won/Lost) bets only — win rate and ROI are computed from these. */
  settled: number;
  settledStake: number;
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
  /** Stake of settled (Won/Lost) bets only — used for accurate per-day ROI. */
  settledStake: number;
  /** Net profit ÷ settled stake, so each day's ROI isn't skewed by open/void. */
  roi: number;
}

export interface BetHighlight {
  payout: number;
  stake: number;
  date: string;
  betId: string;
}

/** A generic per-category performance bucket (bet type, sport, stake, …). */
export interface BreakdownBucket {
  label: string;
  total: number;
  stake: number;
  settledStake: number;
  profit: number;
  won: number;
  settled: number;
  winPct: number;
  roi: number;
}

export interface Report {
  counts: Record<string, number>;
  totalBets: number;
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
  /** "Single", "Multiple" and "Other" (unknown) performance. */
  betTypes: BreakdownBucket[];
  /** Performance by sport, sorted by stake desc. */
  bySport: BreakdownBucket[];
  /** Performance by tournament (top 10 by stake). */
  byTournament: BreakdownBucket[];
  /** Performance by stake-size range. */
  stakeBuckets: BreakdownBucket[];
  /** Performance on weekends. */
  weekendStats: BreakdownBucket;
  /** Date range covered (date-only keys, "" when unknown). */
  period: { first: string; last: string };
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

// The bookmaker's page patches `window.fetch` (it adds its own cache-buster
// and rewrites request URLs). If we call that patched fetch with our absolute
// URL, the URL gets mangled — path doubled + a second `_t` — and returns 404.
// Recover the browser's NATIVE fetch from a fresh same-origin iframe so our
// requests go through untouched.
let cleanFetch: typeof fetch | null = null;

function getCleanFetch(): typeof fetch {
  if (cleanFetch) return cleanFetch;
  try {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "display:none;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const win = iframe.contentWindow as Window | null;
    if (win && typeof win.fetch === "function") {
      cleanFetch = win.fetch.bind(win);
    }
  } catch {
    /* fall through to window.fetch */
  }
  if (!cleanFetch) cleanFetch = window.fetch.bind(window);
  return cleanFetch;
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
  console.log("[Puntrlytics] GET " + url.href);
  const finalInit = Object.assign(
    { credentials: "include" as RequestCredentials },
    init || {}
  );
  finalInit.headers = {
    Accept: "application/json, text/plain, */*",
    ...(init?.headers as Record<string, string> || {})
  };

  return getCleanFetch()(url, finalInit).then((res) => {
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

// Parse dates: epoch millis/seconds, ISO strings, d/m/Y strings. Epoch values
// are rendered in the user's LOCAL timezone (not UTC) so daily buckets and
// the displayed times match the user's wall clock.
export function parseDate(v: unknown): string {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "number") {
    const ms = v > 1e12 ? v : v * 1000;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n: number): string => String(n).padStart(2, "0");
    return (
      d.getFullYear() +
      "-" +
      p(d.getMonth() + 1) +
      "-" +
      p(d.getDate()) +
      " " +
      p(d.getHours()) +
      ":" +
      p(d.getMinutes()) +
      ":" +
      p(d.getSeconds())
    );
  }
  const s = String(v);
  const iso = s.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/);
  if (iso) return iso[0];
  const slash = s.match(/\d{2}\/\d{2}\/\d{4}/);
  if (slash) return slash[0];
  const num = Number(s);
  if (Number.isFinite(num) && num > 1e9) {
    return parseDate(num);
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

// Money parts (sign / symbol / amount) split apart so the UI can size the
// symbol independently of the figure (e.g. a small ₦ next to a large number).
export function moneyParts(
  n: number,
  currency: string,
  signed = false,
): { sign: string; symbol: string; amount: string } {
  const symbol = currencySymbol[currency] || "₦";
  const amount = Math.abs(n).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  const sign = n < 0 ? "-" : signed && n > 0 ? "+" : "";
  return { sign, symbol, amount };
}

// Format money: symbol + thousands separators, max 2 decimals. `signed`
// prefixes "+" on positive values (for profit/ROI figures). The minus sign
// goes before the symbol so negatives read "-₦1,234" rather than "₦-1,234".
export function fmtMoney(n: number, currency: string, signed = false): string {
  const { sign, symbol, amount } = moneyParts(n, currency, signed);
  return sign + symbol + amount;
}

// --- report computation --------------------------------------
// Shares the metrics math with the CLI analyzer (analyze.js) — the build
// verifies the common figures against bets_raw.json. The web adds extra
// breakdown dimensions (bet type, sport, tournament, stake size) on top,
// fed by fields the CLI's scraper doesn't capture.

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
      settled: 0,
      settledStake: 0,
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
      settled: 0,
      settledStake: 0,
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
      settled: 0,
      settledStake: 0,
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
      settled: 0,
      settledStake: 0,
      winPct: 0,
      roi: 0,
    },
  ];

  const timeline: Record<string, DaySummary> = {};

  // Breakdown buckets: bet type, sport, tournament, stake size.
  const newBucket = (label: string): BreakdownBucket => ({
    label,
    total: 0,
    stake: 0,
    settledStake: 0,
    profit: 0,
    won: 0,
    settled: 0,
    winPct: 0,
    roi: 0,
  });
  const betTypeMap: Record<string, BreakdownBucket> = {
    Single: newBucket("Single"),
    Multiple: newBucket("Multiple"),
    Other: newBucket("Other"),
  };
  const sportMap: Record<string, BreakdownBucket> = {};
  const tournamentMap: Record<string, BreakdownBucket> = {};

  const STAKE_EDGES: Array<{ label: string; min?: number; max?: number }> = [
    { label: "≤ 500", max: 500 },
    { label: "501 – 1,000", min: 501, max: 1000 },
    { label: "1,001 – 5,000", min: 1001, max: 5000 },
    { label: "5,001 – 10,000", min: 5001, max: 10000 },
    { label: "10,001 – 50,000", min: 10001, max: 50000 },
    { label: "50,000+", min: 50001 },
  ];
  const stakeBuckets: BreakdownBucket[] = STAKE_EDGES.map((e) =>
    newBucket(e.label),
  );

  const weekendStats = newBucket("Weekend");

  let firstDate = "";
  let lastDate = "";

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
    if (status === "Won" || status === "Lost") {
      d.settled++;
      d.settledStake += stake;
    }

    // Day bucket — normalize every key to YYYY-MM-DD so mixed formats
    // (ISO vs d/m/Y) group to the same day and sort chronologically.
    const rawDate = bet.date || "";
    const iso = rawDate.match(/^\d{4}-\d{2}-\d{2}/);
    const slash = rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    const dateKey = iso
      ? iso[0]
      : slash
        ? `${slash[3]}-${slash[2]}-${slash[1]}`
        : "Unknown Date";
    let t = timeline[dateKey];
    if (!t) {
      t = {
        date: dateKey,
        stake: 0,
        payout: 0,
        profit: 0,
        won: 0,
        total: 0,
        settledStake: 0,
        roi: 0,
      };
      timeline[dateKey] = t;
    }
    t.stake += stake;
    t.payout += payout;
    t.profit += profit;
    t.total++;
    if (status === "Won") t.won++;
    if (status === "Won" || status === "Lost") t.settledStake += stake;

    // Bet-type bucket (Single / Multiple / Other)
    const bt = betTypeMap[bet.betType || "Other"] || betTypeMap.Other;
    bt.total++;
    bt.stake += stake;
    if (status === "Won") bt.won++;
    if (status === "Won" || status === "Lost") {
      bt.settled++;
      bt.settledStake += stake;
      bt.profit += profit;
    }

    // Sport / tournament buckets
    const sportKey = bet.sport || "Unknown";
    const sp = (sportMap[sportKey] ||= newBucket(sportKey));
    sp.total++;
    sp.stake += stake;
    if (status === "Won") sp.won++;
    if (status === "Won" || status === "Lost") {
      sp.settled++;
      sp.settledStake += stake;
      sp.profit += profit;
    }

    const tournamentKey = bet.tournament || "Unknown";
    const tn = (tournamentMap[tournamentKey] ||= newBucket(tournamentKey));
    tn.total++;
    tn.stake += stake;
    if (status === "Won") tn.won++;
    if (status === "Won" || status === "Lost") {
      tn.settled++;
      tn.settledStake += stake;
      tn.profit += profit;
    }

    // Stake-size bucket
    const sb = stakeBuckets.find(
      (_, i) =>
        (STAKE_EDGES[i].min === undefined ||
          stake >= (STAKE_EDGES[i].min as number)) &&
        (STAKE_EDGES[i].max === undefined ||
          stake <= (STAKE_EDGES[i].max as number)),
    );
    if (sb) {
      sb.total++;
      sb.stake += stake;
      if (status === "Won") sb.won++;
      if (status === "Won" || status === "Lost") {
        sb.settled++;
        sb.settledStake += stake;
        sb.profit += profit;
      }
    }
    
    // Weekend Stats bucket (Saturday or Sunday)
    if (dateKey !== "Unknown Date") {
      const betDate = new Date(dateKey);
      const day = betDate.getDay();
      if (day === 0 || day === 6) {
        weekendStats.total++;
        weekendStats.stake += stake;
        if (status === "Won") weekendStats.won++;
        if (status === "Won" || status === "Lost") {
          weekendStats.settled++;
          weekendStats.settledStake += stake;
          weekendStats.profit += profit;
        }
      }
    }

    // Report period (date-only key)
    if (dateKey !== "Unknown Date") {
      if (!firstDate || dateKey < firstDate) firstDate = dateKey;
      if (!lastDate || dateKey > lastDate) lastDate = dateKey;
    }

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
    d.winPct = d.settled > 0 ? (d.won / d.settled) * 100 : 0;
    d.roi = d.settledStake > 0 ? (d.profit / d.settledStake) * 100 : 0;
  }

  const days = Object.keys(timeline)
    .map((k) => timeline[k])
    .sort((a, b) => {
      // Chronological (oldest first); "Unknown Date" sinks to the bottom.
      const da = a.date === "Unknown Date" ? "" : a.date;
      const db = b.date === "Unknown Date" ? "" : b.date;
      if (da === "" && db === "") return 0;
      if (da === "") return 1;
      if (db === "") return -1;
      return da < db ? -1 : da > db ? 1 : 0;
    });

  // Per-day ROI uses settled stake only, so open/void bets don't distort it.
  for (const d of days) {
    d.roi = d.settledStake > 0 ? (d.profit / d.settledStake) * 100 : 0;
  }

  // Finalize breakdown buckets: win rate + ROI from settled stake only.
  const finalize = (b: BreakdownBucket): void => {
    b.winPct = b.settled > 0 ? (b.won / b.settled) * 100 : 0;
    b.roi = b.settledStake > 0 ? (b.profit / b.settledStake) * 100 : 0;
  };
  const betTypes = [
    betTypeMap.Single,
    betTypeMap.Multiple,
    betTypeMap.Other,
  ].filter((b) => b.total > 0);
  betTypes.forEach(finalize);

  const bySport = Object.values(sportMap).filter((b) => b.total > 0);
  bySport.forEach(finalize);
  bySport.sort((a, b) => b.stake - a.stake);

  const byTournament = Object.values(tournamentMap)
    .filter((b) => b.total > 0)
    .sort((a, b) => b.stake - a.stake)
    .slice(0, 10);
  byTournament.forEach(finalize);

  const stakeBucketList = stakeBuckets.filter((b) => b.total > 0);
  stakeBucketList.forEach(finalize);

  finalize(weekendStats);

  return {
    counts,
    totalBets: bets.length,
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
    betTypes,
    bySport,
    byTournament,
    stakeBuckets: stakeBucketList,
    weekendStats,
    period: { first: firstDate, last: lastDate },
  };
}
