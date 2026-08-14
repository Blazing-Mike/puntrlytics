// Sanity check for the doubled-URL fix: normalizes the exact malformed URL
// the user's browser was requesting on SportyBet, plus the correct form.
import { normalizeApiUrl } from "../src/core";

// [input, expected, pageOrigin]
const cases: Array<[string, string, string]> = [
  // The bug: "https://host/api/ng/" + "/host/api/ng/orders/..." doubled.
  [
    "https://www.sportybet.com/api/ng//www.sportybet.com/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com",
  ],
  // Already correct → unchanged.
  [
    "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com",
  ],
  // football.com equivalent (running on football.com).
  [
    "https://www.football.com/api/ng//www.football.com/api/ng/orders/order/v2/realbetlist",
    "https://www.football.com/api/ng/orders/order/v2/realbetlist",
    "https://www.football.com",
  ],
  // Stale/hardcoded host differs from the page we're on → forced same-origin.
  [
    "https://stale-old.sportybet.com/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com",
  ],
  // Relative path → resolved against the page origin.
  [
    "/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
    "https://www.sportybet.com",
  ],
];

let failed = false;
for (const [input, expected, origin] of cases) {
  const got = normalizeApiUrl(input, origin);
  const ok = got === expected;
  if (!ok) failed = true;
  console.log(
    `${ok ? "✔" : "✘"} ${input}\n   → ${got}${ok ? "" : `\n   expected ${expected}`}`,
  );
}
if (failed) process.exit(1);
console.log("\n✔ URL normalization checks passed.");
