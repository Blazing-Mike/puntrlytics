// Shared provider factory for the "realbetlist" JSON API that football.com
// and SportyBet expose. Both sites return an identical order shape (same
// field names, same winningStatus codes), so one normalizer serves both.
//
// The API is same-origin: the bookmarklet runs on the bookmaker's own site
// (where the user is logged in) and calls this endpoint with
// `Accept: application/json` — the server then replies with JSON instead of
// the XML you get when opening the URL in a browser address bar.

import { fetchJson, parseDate, pick, toNum, type Bet, type Provider } from "../core";

export interface RealBetListProviderOptions {
  id: string;
  name: string;
  currency: string;
  apiBase: string;
  /** Query params the site's UI sends (settled history tab, etc.). */
  baseParams?: Record<string, string | number>;
  /** Name of a cache-buster param (e.g. "_t") filled with Date.now() per request. */
  cacheBuster?: string;
}

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

const MAX_PAGES = 100;
const PAGE_SIZE = 100;

// winningStatus codes: 20 = Won, 30 = Lost, 10 = Void, 40 = Open
function mapStatus(raw: RawOrder): string {
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(raw)) lower[k.toLowerCase()] = raw[k];

  const winFlag =
    lower.iswin !== undefined ? lower.iswin
      : lower.iswinloss !== undefined ? lower.iswinloss
      : lower.iswinflag;
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
      "orderno", "orderid", "betno", "ticketno", "ticketid", "betid",
      "id", "refno", "serialno",
    ]) ?? "",
  );

  const stake = toNum(
    pick(lower, [
      "stakeamount", "stake", "betamount", "amount", "stakemoney",
      "wager", "totalstake", "money",
    ]),
  );

  const payout = toNum(
    pick(lower, [
      "returnamount", "winamount", "payout", "return", "winmoney",
      "profitamount", "earnamount", "winning", "totalwinnings",
    ]),
  );

  // No order-level odds field — the total odds of an accumulator is the
  // product of its selections' odds.
  let odds = toNum(
    pick(lower, ["totalodds", "odds", "odd", "rate", "multiple", "bonus", "oddsvalue"]),
  );
  if (!odds && Array.isArray(raw.selections) && raw.selections.length > 0) {
    const selOdds = raw.selections
      .map((s) => toNum(s && s.odds))
      .filter((o) => o > 0);
    if (selOdds.length > 0) odds = selOdds.reduce((a, b) => a * b, 1);
  }

  return {
    betId,
    date: parseDate(
      pick(lower, [
        "createtime", "createdate", "bettime", "ordertime", "createdtime",
        "addtime", "settletime", "date",
      ]),
    ),
    stake,
    payout,
    odds,
    status: mapStatus(raw),
  };
}

export function createRealBetListProvider(opts: RealBetListProviderOptions): Provider {
  const baseParams = opts.baseParams || DEFAULT_BASE_PARAMS;

  async function fetchBets(progress?: (msg: string) => void): Promise<Bet[]> {
    const seen = new Set<string>();
    const bets: Bet[] = [];
    let total: number | null = null;
    let pageNo = 1;

    for (;;) {
      const params: Record<string, string | number> = { ...baseParams, pageNo, pageSize: PAGE_SIZE };
      if (opts.cacheBuster) params[opts.cacheBuster] = Date.now();

      const json = await fetchJson(opts.apiBase, params);
      const data = (json as { data?: { entityList?: RawOrder[]; totalNum?: number } }).data;
      const list = (data && data.entityList) || [];
      if (total === null && data && typeof data.totalNum === "number") total = data.totalNum;

      let added = 0;
      for (const item of list) {
        const b = normalizeOrder(item);
        if (!seen.has(b.betId)) {
          seen.add(b.betId);
          bets.push(b);
          added++;
        }
      }

      if (progress) progress(`Fetched ${bets.length}${total ? " of ~" + total : ""} bets…`);

      // Stop when the server returns nothing new, we have everything, or
      // the safety limit is reached (a page returning 0 new records means
      // pagination isn't advancing).
      if (
        list.length === 0 ||
        added === 0 ||
        (total !== null && bets.length >= total) ||
        pageNo >= MAX_PAGES
      ) {
        break;
      }
      pageNo++;
    }

    return bets;
  }

  return {
    id: opts.id,
    name: opts.name,
    currency: opts.currency,
    fetchBets,
  };
}
