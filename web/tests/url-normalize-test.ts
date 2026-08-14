// Sanity check for the doubled-URL fix: normalizes the exact malformed URL
// the user's browser was requesting on SportyBet, plus the correct form.
import { normalizeApiUrl } from "../src/core";

const cases: Array<[string, string]> = [
  // The bug: "https://host/api/ng/" + "/host/api/ng/orders/..." doubled.
  [
    "https://www.sportybet.com/api/ng//www.sportybet.com/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
  ],
  // Already correct → unchanged.
  [
    "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
  ],
  // football.com equivalent.
  [
    "https://www.football.com/api/ng//www.football.com/api/ng/orders/order/v2/realbetlist",
    "https://www.football.com/api/ng/orders/order/v2/realbetlist",
  ],
];

let failed = false;
for (const [input, expected] of cases) {
  const got = normalizeApiUrl(input, "https://www.sportybet.com");
  const ok = got === expected;
  if (!ok) failed = true;
  console.log(
    `${ok ? "✔" : "✘"} ${input}\n   → ${got}${ok ? "" : `\n   expected ${expected}`}`,
  );
}
if (failed) process.exit(1);
console.log("\n✔ URL normalization checks passed.");
