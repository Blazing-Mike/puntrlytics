// Shared provider factory for the "realbetlist" JSON API that football.com
// and SportyBet expose. Both sites return an identical order shape (same
// field names, same winningStatus codes), so one normalizer serves both.
//
// The API is same-origin: the bookmarklet runs on the bookmaker's own site
// (where the user is logged in) and calls this endpoint with
// `Accept: application/json` — the server then replies with JSON instead of
// the XML you get when opening the URL in a browser address bar.
//
// The same endpoint is also reachable with a user-supplied session token;
// fetchAllRealBetList below is transport-agnostic so both paths share the
// exact pagination + normalization logic.

import {
  fetchJson,
  parseDate,
  pick,
  toNum,
  type Bet,
  type Provider,
} from "../../../src/lib/core";

export interface RealBetListProviderOptions {
  id: string;
  name: string;
  currency: string;
  apiBase: string;
  /** Query params the site's UI sends (settled history tab, etc.). */
  baseParams?: Record<string, string | number>;
  /** Name of a cache-buster param (e.g. "_t") filled with Date.now() per request. */
  cacheBuster?: string;
  /** Key for the array of bets in the JSON response (default: "entityList") */
  listKey?: string;
  /** Key for the total count of bets in the JSON response (default: "totalNum") */
  totalKey?: string;
  /** Query param for the page number (default: "pageNo") */
  pageParam?: string;
  /** Query param for the page size (default: "pageSize") */
  sizeParam?: string;
  /** Custom headers to send with the request */
  headers?: Record<string, string> | (() => Record<string, string>);
}

export interface RealBetListFetchOptions {
  apiBase: string;
  baseParams?: Record<string, string | number>;
  cacheBuster?: string;
  /** Hard cap on pages walked (server calls use this to stay in time budget). */
  maxPages?: number;
  listKey?: string;
  totalKey?: string;
  pageParam?: string;
  sizeParam?: string;
  headers?: Record<string, string> | (() => Record<string, string>);
}

// One GET that returns parsed JSON. The browser bookmarklet passes a
// same-origin fetch (logged-in session cookie).
export type RealBetListHttpGet = (url: string) => Promise<unknown>;

interface RawSelection {
  odds?: unknown;
  [k: string]: unknown;
}

interface RawOrder {
  selections?: RawSelection[];
  [k: string]: unknown;
}

const DEFAULT_BASE_PARAMS: Record<string, string> = {
  isSettled: "10",
  onlyWinnings: "0",
  isHistory: "0",
};

// Safety cap against infinite pagination. 2000 pages × up to 100 bets/page =
// 200,000 bets — far beyond any real account, so this never truncates in
// practice (a warning is logged if it's ever reached).
const MAX_PAGES = 2000;
const PAGE_SIZE = 100;

// winningStatus codes: 20 = Won, 30 = Lost, 10 = Void, 40 = Open
function mapStatus(raw: RawOrder): string {
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(raw)) lower[k.toLowerCase()] = raw[k];

  const winFlag =
    lower.iswin !== undefined
      ? lower.iswin
      : lower.iswinloss !== undefined
        ? lower.iswinloss
        : lower.iswinflag;
  if (typeof winFlag === "boolean") return winFlag ? "Won" : "Lost";
  if (winFlag === 1 || winFlag === "1" || winFlag === "Y" || winFlag === "true")
    return "Won";
  if (
    winFlag === 0 ||
    winFlag === "0" ||
    winFlag === "N" ||
    winFlag === "false"
  )
    return "Lost";

  const status = pick(lower, [
    "winningstatus",
    "status",
    "orderstatus",
    "betstatus",
    "state",
    "winloss",
    "result",
    "statusname",
    "statustext",
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
    if (num === 20) return "Won";
    if (num === 30) return "Lost";
    if (num === 10) return "Void";
    if (num === 40) return "Open";
    if (num === 1) return "Won";
    if (num === 2 || num === 0) return "Lost";
    if (num === 3 || num === -1) return "Void";
    if (num === 4 || num === 5) return "Open";
    return "Unknown";
  }
  return "Unknown";
}

// Exported so the normalizer can be unit-tested against real API samples.
export function normalizeOrder(raw: RawOrder): Bet {
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(raw)) lower[k.toLowerCase()] = raw[k];

  const betId = String(
    pick(lower, [
      "orderno",
      "orderid",
      "betno",
      "ticketno",
      "ticketid",
      "betid",
      "id",
      "refno",
      "serialno",
    ]) ?? "",
  );

  const stake = toNum(
    pick(lower, [
      "stakeamount",
      "stake",
      "betamount",
      "amount",
      "stakemoney",
      "wager",
      "totalstake",
      "money",
    ]),
  );

  const payout = toNum(
    pick(lower, [
      "returnamount",
      "winamount",
      "payout",
      "return",
      "winmoney",
      "profitamount",
      "earnamount",
      "winning",
      "totalwinnings",
    ]),
  );

  // No order-level odds field — the total odds of an accumulator is the
  // product of its selections' odds.
  let odds = toNum(
    pick(lower, [
      "totalodds",
      "odds",
      "odd",
      "rate",
      "multiple",
      "bonus",
      "oddsvalue",
    ]),
  );
  if (!odds && Array.isArray(raw.selections) && raw.selections.length > 0) {
    const selOdds = raw.selections
      .map((s) => toNum(s && s.odds))
      .filter((o) => o > 0);
    if (selOdds.length > 0) odds = selOdds.reduce((a, b) => a * b, 1);
  }

  // If odds are still missing (e.g., MSport), try to infer them from potential payout or actual payout.
  if (!odds) {
    const potentialReturn = toNum(pick(lower, ["toreturn", "potentialreturn"]));
    if (potentialReturn > 0 && stake > 0) {
      odds = potentialReturn / stake;
    } else if (payout > 0 && stake > 0) {
      odds = payout / stake;
    }
  }

  // Bet type + sport/tournament, derived from the selections. The API carries
  // `orderType` (1 = single, 2 = multiple) and `selectionSize`, plus each
  // selection's `categoryName` (sport) and `tournamentName` (league).
  const rawSels = Array.isArray(raw.selections) ? raw.selections : [];
  // Selections come in camelCase (categoryName, tournamentName) — build a
  // lowercase-keyed copy so one lookup handles camelCase and lower_case alike.
  const selStr = (s: RawSelection | undefined, keys: string[]): string => {
    if (!s) return "";
    const rec: Record<string, unknown> = {};
    for (const k of Object.keys(s)) rec[k.toLowerCase()] = s[k];
    for (const k of keys) {
      const v = rec[k];
      if (typeof v === "string" && v.trim()) return v;
    }
    return "";
  };
  const uniq = (arr: string[]): string[] => Array.from(new Set(arr));

  const selectionSize =
    toNum(pick(lower, ["selectionsize", "selectioncount", "selcount"])) ||
    rawSels.length;
  const orderType = toNum(pick(lower, ["ordertype"]));

  let betType = "";
  if (selectionSize > 1) betType = "Multiple";
  else if (selectionSize === 1) betType = "Single";
  else if (orderType === 1) betType = "Single";
  else if (orderType > 1) betType = "Multiple";

  const sports = rawSels
    .map((s) =>
      selStr(s, ["categoryname", "sportname", "sport", "category"]),
    )
    .filter(Boolean);
  const tournaments = rawSels
    .map((s) =>
      selStr(s, [
        "tournamentname",
        "leaguename",
        "league",
        "competitionname",
        "competition",
      ]),
    )
    .filter(Boolean);
  const uniqSports = uniq(sports);
  const uniqTournaments = uniq(tournaments);
  const sport =
    uniqSports.length === 0
      ? ""
      : uniqSports.length === 1
        ? uniqSports[0]
        : "Mixed";
  const tournament =
    uniqTournaments.length === 0
      ? ""
      : uniqTournaments.length === 1
        ? uniqTournaments[0]
        : "Mixed";

  return {
    betId,
    date: parseDate(
      pick(lower, [
        "createtime",
        "createdate",
        "bettime",
        "ordertime",
        "createdtime",
        "addtime",
        "settletime",
        "date",
      ]),
    ),
    stake,
    payout,
    odds,
    status: mapStatus(raw),
    betType,
    sport,
    tournament,
  };
}

// Fetch-agnostic paginated reader for the realbetlist API. Walks every page
// of the user's bet history and normalizes each order with normalizeOrder.
// `httpGet` decides the transport: browser session cookies (bookmarklet) or
// a user-supplied token.
export async function fetchAllRealBetList(
  opts: RealBetListFetchOptions,
  httpGet: RealBetListHttpGet,
  progress?: (msg: string) => void,
): Promise<Bet[]> {
  const baseParams = opts.baseParams || DEFAULT_BASE_PARAMS;
  const maxPages = opts.maxPages && opts.maxPages > 0 ? opts.maxPages : MAX_PAGES;
  const seen = new Set<string>();
  const bets: Bet[] = [];
  let total: number | null = null;
  let pageNo = 1;

  for (;;) {
    const params: Record<string, string | number> = {
      ...baseParams,
      [opts.pageParam || "pageNo"]: pageNo,
      [opts.sizeParam || "pageSize"]: PAGE_SIZE,
    };
    if (opts.cacheBuster) params[opts.cacheBuster] = Date.now();

    const url = new URL(opts.apiBase);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "")
        url.searchParams.set(k, String(v));
    }

    const json = await httpGet(url.href);
    const data = (json as Record<string, any>).data;
    const list = (data && data[opts.listKey || "entityList"]) || [];
    
    if (total === null && data && typeof data[opts.totalKey || "totalNum"] === "number") {
      total = data[opts.totalKey || "totalNum"];
    }

    let added = 0;
    for (const item of list) {
      const b = normalizeOrder(item);
      // Fallback key so bets whose ID couldn't be extracted never collapse
      // into a single "empty ID" record and silently disappear.
      const key = b.betId || "no-id:" + JSON.stringify(item);
      if (!seen.has(key)) {
        seen.add(key);
        bets.push(b);
        added++;
      }
    }

    if (progress)
      progress(`Fetched ${bets.length}${total ? " of ~" + total : ""} bets…`);

    // Stop when the server returns nothing new or we have everything.
    if (
      list.length === 0 ||
      added === 0 ||
      (total !== null && bets.length >= total)
    ) {
      break;
    }
    // Safety cap against an infinite loop; generous enough that no real
    // account should ever hit it (2000 × 100 = 200,000 bets).
    if (pageNo >= maxPages) {
      break;
    }
    pageNo++;
  }

  if (total !== null && bets.length < total) {
    console.warn(
      `[Puntrlytics] Pagination ended early: fetched ${bets.length} of ~${total} bets. ` +
        "The server may cap pageSize or pagination may have stalled — see Network tab.",
    );
  }

  return bets;
}

export function createRealBetListProvider(
  opts: RealBetListProviderOptions,
): Provider {
  async function fetchBets(progress?: (msg: string) => void): Promise<Bet[]> {
    // Same-origin browser transport: rides the logged-in session cookie.
      return fetchAllRealBetList(
        {
          apiBase: opts.apiBase,
          baseParams: opts.baseParams,
          cacheBuster: opts.cacheBuster,
          listKey: opts.listKey,
          totalKey: opts.totalKey,
          pageParam: opts.pageParam,
          sizeParam: opts.sizeParam,
          headers: opts.headers,
        },
        (url) => fetchJson(url, undefined, { 
          headers: typeof opts.headers === "function" ? opts.headers() : opts.headers 
        }),
        progress,
      );
  }

  return {
    id: opts.id,
    name: opts.name,
    currency: opts.currency,
    fetchBets,
  };
}
