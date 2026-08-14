// src/core.ts
function pick(obj, keys) {
  for (const k of keys) {
    const v = obj[k];
    if (v !== void 0 && v !== null && v !== "") return v;
  }
  return void 0;
}
function toNum(v) {
  if (v === void 0 || v === null || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function parseDate(v) {
  if (v === void 0 || v === null || v === "") return "";
  if (typeof v === "number") {
    const ms = v > 1e12 ? v : v * 1e3;
    return new Date(ms).toISOString().replace("T", " ").substring(0, 19);
  }
  const s = String(v);
  const iso = s.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/);
  if (iso) return iso[0];
  const slash = s.match(/\d{2}\/\d{2}\/\d{4}/);
  if (slash) return slash[0];
  const num = Number(s);
  if (Number.isFinite(num) && num > 1e9) {
    return new Date(num > 1e12 ? num : num * 1e3).toISOString().replace("T", " ").substring(0, 19);
  }
  return s;
}

// src/providers/realbetlist.ts
function mapStatus(raw2) {
  const lower = {};
  for (const k of Object.keys(raw2)) lower[k.toLowerCase()] = raw2[k];
  const winFlag = lower.iswin !== void 0 ? lower.iswin : lower.iswinloss !== void 0 ? lower.iswinloss : lower.iswinflag;
  if (typeof winFlag === "boolean") return winFlag ? "Won" : "Lost";
  if (winFlag === 1 || winFlag === "1" || winFlag === "Y" || winFlag === "true") return "Won";
  if (winFlag === 0 || winFlag === "0" || winFlag === "N" || winFlag === "false") return "Lost";
  const status = pick(lower, [
    "winningstatus",
    "status",
    "orderstatus",
    "betstatus",
    "state",
    "winloss",
    "result",
    "statusname",
    "statustext"
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
function normalizeOrder(raw2) {
  const lower = {};
  for (const k of Object.keys(raw2)) lower[k.toLowerCase()] = raw2[k];
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
      "serialno"
    ]) ?? ""
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
      "money"
    ])
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
      "totalwinnings"
    ])
  );
  let odds = toNum(
    pick(lower, ["totalodds", "odds", "odd", "rate", "multiple", "bonus", "oddsvalue"])
  );
  if (!odds && Array.isArray(raw2.selections) && raw2.selections.length > 0) {
    const selOdds = raw2.selections.map((s) => toNum(s && s.odds)).filter((o) => o > 0);
    if (selOdds.length > 0) odds = selOdds.reduce((a, b) => a * b, 1);
  }
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
        "date"
      ])
    ),
    stake,
    payout,
    odds,
    status: mapStatus(raw2)
  };
}

// tests/sportybet-test.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var root = path.dirname(fileURLToPath(import.meta.url));
var raw = JSON.parse(fs.readFileSync(path.join(root, "sportybet-sample.json"), "utf8"));
var bets = raw.data.entityList.map((o) => normalizeOrder(o));
var round = (n) => Math.round(n * 100) / 100;
var failures = [];
function check(name, actual, expected) {
  if (actual !== expected) {
    failures.push(`${name}: expected ${expected}, got ${actual}`);
  }
}
check("bet1 id", bets[0].betId, "260607152552ord60313844");
check("bet1 status", bets[0].status, "Lost");
check("bet1 stake", bets[0].stake, 1e3);
check("bet1 payout", bets[0].payout, 0);
check("bet1 odds", bets[0].odds, 1.29);
check("bet1 date", bets[0].date.slice(0, 10), "2026-06-07");
check("bet2 status", bets[1].status, "Won");
check("bet2 stake", bets[1].stake, 100);
check("bet2 payout", bets[1].payout, 127);
check("bet2 odds", bets[1].odds, 1.27);
check("bet3 status", bets[2].status, "Lost");
check("bet3 stake", bets[2].stake, 500);
check("bet3 odds (product)", round(bets[2].odds), round(1.42 * 1.21 * 1.38 * 1.09 * 1.17));
console.log("Normalized bets:");
for (const b of bets) console.log(`  ${b.betId} | ${b.date} | stake ${b.stake} | payout ${b.payout} | odds ${round(b.odds)} | ${b.status}`);
if (failures.length) {
  console.error("\nFAILURES:");
  failures.forEach((f) => console.error("  - " + f));
  process.exit(1);
}
console.log("\n\u2714 All SportyBet normalization checks passed.");
