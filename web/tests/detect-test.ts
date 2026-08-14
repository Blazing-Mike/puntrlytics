// Verifies the auto-detect bookmarklet maps hostnames to the right provider.
import { detectProvider } from "../src/providers/detect";

const cases: Array<[string, string | null]> = [
  ["www.sportybet.com", "sportybet"],
  ["sportybet.com", "sportybet"],
  ["sports.sportybet.com", "sportybet"],
  ["www.football.com", "football"],
  ["football.com", "football"],
  ["some.other.site.com", null],
  ["", null],
];

let failed = false;
for (const [host, expectedId] of cases) {
  const p = detectProvider(host);
  const got = p ? p.id : null;
  const ok = got === expectedId;
  if (!ok) failed = true;
  console.log(
    `${ok ? "✔" : "✘"} ${host || "(empty)"} → ${got}${ok ? "" : ` (expected ${expectedId})`}`,
  );
}
if (failed) process.exit(1);
console.log("\n✔ Auto-detect hostname checks passed.");
