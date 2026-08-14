// Throws the shared normalizer at a copy of the user's real SportyBet API
// response to prove normalization works for SportyBet's exact field shape.
import { normalizeOrder } from "../src/providers/realbetlist";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(fs.readFileSync(path.join(root, "sportybet-sample.json"), "utf8"));

const bets = raw.data.entityList.map((o: unknown) => normalizeOrder(o as never));

const round = (n: number) => Math.round(n * 100) / 100;
const failures: string[] = [];

function check(name: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    failures.push(`${name}: expected ${expected}, got ${actual}`);
  }
}

check("bet1 id", bets[0].betId, "260607152552ord60313844");
check("bet1 status", bets[0].status, "Lost");
check("bet1 stake", bets[0].stake, 1000);
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
console.log("\n✔ All SportyBet normalization checks passed.");
