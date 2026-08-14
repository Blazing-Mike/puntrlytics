// Build pipeline:
//   1. Bundle each src/entries/<provider>.ts into a minified self-contained
//      bookmarklet (dist/bookmarklet-<provider>.js) and its javascript: URL.
//   2. Generate the demo report page (dist/demo.html).
//   3. Verify the shared core still matches the CLI analyzer on real data.
//   4. Render the install/landing page (dist/index.html) with the bookmarklet.
//
// To add a provider: write src/providers/<id>.ts + src/entries/<id>.ts and
// rebuild — the install page picks up the new bookmarklet automatically.

import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, "src");
const entriesDir = path.join(src, "entries");
const dist = path.join(root, "dist");

fs.mkdirSync(dist, { recursive: true });

const SKIP_AS_BOOKMARKLET = new Set(["demo.ts", "verify.ts"]);

const entries = fs
  .readdirSync(entriesDir)
  .filter((f) => f.endsWith(".ts"))
  .sort();
const bookmarkletEntries = entries.filter((f) => !SKIP_AS_BOOKMARKLET.has(f));

// 1) Bookmarklets -------------------------------------------------
const bookmarklets = [];
for (const f of bookmarkletEntries) {
  const id = f.replace(/\.ts$/, "");
  await build({
    entryPoints: [path.join(entriesDir, f)],
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2019"],
    outfile: path.join(dist, `bookmarklet-${id}.js`),
  });
  const code = fs.readFileSync(path.join(dist, `bookmarklet-${id}.js`), "utf8");
  const url = "javascript:" + encodeURIComponent(code);
  fs.writeFileSync(path.join(dist, `bookmarklet-${id}.txt`), url, "utf8");
  bookmarklets.push({ id, code, url });
  const kb = (code.length / 1024).toFixed(1);
  const warn = code.length > 32000 ? "  ⚠ >32KB (may not work in Safari)" : "";
  console.log(`✔ bookmarklet-${id}.js  ${kb} KB minified, URL ${url.length} chars${warn}`);
}

// 2) Demo + verify bundles (Node-importable ESM) -------------------
const demoBundle = path.join(dist, ".demo-bundle.mjs");
const verifyBundle = path.join(dist, ".verify-bundle.mjs");
await build({
  entryPoints: [path.join(entriesDir, "demo.ts")],
  bundle: true,
  format: "esm",
  target: ["node18"],
  outfile: demoBundle,
});
await build({
  entryPoints: [path.join(entriesDir, "verify.ts")],
  bundle: true,
  format: "esm",
  target: ["node18"],
  outfile: verifyBundle,
});

const { buildDemoHtml } = await import(pathToFileURL(demoBundle).href);
fs.writeFileSync(path.join(dist, "demo.html"), buildDemoHtml(), "utf8");
console.log("✔ demo.html (sample report)");

// 3) Core verification against the CLI dataset --------------------
const betsPath = path.join(root, "..", "bets_raw.json");
if (fs.existsSync(betsPath)) {
  const { computeReport } = await import(pathToFileURL(verifyBundle).href);
  const bets = JSON.parse(fs.readFileSync(betsPath, "utf8"));
  const r = computeReport(bets);
  const expected = {
    totalStakes: 313075,
    totalPayouts: 298266.35,
    netProfit: -14808.65,
    settledTotal: 141,
    won: 44,
  };
  const close = (a, b) => Math.abs(a - b) < 0.01;
  const ok =
    close(r.totalStakes, expected.totalStakes) &&
    close(r.totalPayouts, expected.totalPayouts) &&
    close(r.netProfit, expected.netProfit) &&
    r.settledTotal === expected.settledTotal &&
    r.counts.Won === expected.won;
  console.log(
    `✔ core vs bets_raw.json: stakes ${r.totalStakes}, payouts ${r.totalPayouts.toFixed(2)}, ` +
      `net ${r.netProfit.toFixed(2)}, win rate ${r.winRate.toFixed(2)}% (${r.counts.Won}/${r.settledTotal}) — ` +
      (ok ? "MATCHES CLI" : "MISMATCH!"),
  );
  if (!ok) process.exitCode = 1;
} else {
  console.log("ℹ no bets_raw.json at project root — skipping core verification");
}

// 4) Install / landing page ---------------------------------------
const tplPath = path.join(root, "template", "install.html");
const tpl = fs.readFileSync(tplPath, "utf8");
const escHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const primary = bookmarklets.find((b) => b.id === "football") || bookmarklets[0];
let html = tpl;
if (primary) {
  html = html.split("{{BOOKMARKLET_HREF}}").join(primary.url);
  html = html.split("{{BOOKMARKLET_CODE}}").join(escHtml(primary.code));
} else {
  html = html.split("{{BOOKMARKLET_HREF}}").join("#");
  html = html.split("{{BOOKMARKLET_CODE}}").join("(no provider built)");
}
html = html.split("{{PROVIDER_NAME}}").join(primary ? "football.com" : "your bookmaker");
html = html.split("{{BUILD_DATE}}").join(new Date().toISOString().slice(0, 10));
html = html.split("{{DEMO_HREF}}").join("demo.html");
fs.writeFileSync(path.join(dist, "index.html"), html, "utf8");
console.log("✔ index.html (install page)");

// Clean up temp bundles
fs.rmSync(demoBundle, { force: true });
fs.rmSync(verifyBundle, { force: true });

console.log("\nDone → web/dist/ (host this folder)");
