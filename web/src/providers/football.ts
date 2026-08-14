// football.com provider — fetches every page of the user's bet history
// from the same JSON API the site's Bet History page uses (the page loads
// more bets as you scroll; there is no "Next" button).

import { fetchJson, parseDate, pick, toNum, type Bet, type Provider } from "../core";

interface RawSelection {
  odds?: unknown;
  [k: string]: unknown;
}

interface RawOrder {
  selections?: RawSelection[];
  [k: string]: unknown;
}

const API_BASE = "https://www.football.com/api/ng/orders/order/v2/realbetlist";

// Filters the site's UI sends on the Bet History page.
const BASE_PARAMS = { isSettled: "10", onlyWinnings: "0", isHistory: "0" };

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

function normalize(raw: RawOrder): Bet {
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

  // football.com has no order-level odds field — the total odds of an
  // accumulator is the product of its selections' odds.
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

async function fetchBets(progress?: (msg: string) => void): Promise<Bet[]> {
  const seen = new Set<string>();
  const bets: Bet[] = [];
  let total: number | null = null;
  let pageNo = 1;

  for (;;) {
    const json = await fetchJson(API_BASE, { ...BASE_PARAMS, pageNo, pageSize: PAGE_SIZE });
    const data = (json as { data?: { entityList?: RawOrder[]; totalNum?: number } }).data;
    const list = (data && data.entityList) || [];
    if (total === null && data && typeof data.totalNum === "number") total = data.totalNum;

    for (const item of list) {
      const b = normalize(item);
      if (!seen.has(b.betId)) {
        seen.add(b.betId);
        bets.push(b);
      }
    }

    if (progress) progress(`Fetched ${bets.length}${total ? " of ~" + total : ""} bets…`);

    if (list.length === 0 || (total !== null && bets.length >= total) || pageNo >= MAX_PAGES) {
      break;
    }
    pageNo++;
  }

  return bets;
}

export const footballProvider: Provider = {
  id: "football",
  name: "football.com",
  currency: "NGN",
  fetchBets,
};
