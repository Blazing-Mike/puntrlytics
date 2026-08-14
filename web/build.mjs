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
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, "src");
const entriesDir = path.join(src, "entries");
const dist = path.join(root, "dist");

fs.mkdirSync(dist, { recursive: true });

// 0) Static assets (screenshots, etc.) --------------------------------
const staticDir = path.join(root, "static");
if (fs.existsSync(staticDir)) {
  for (const f of fs.readdirSync(staticDir)) {
    const src = path.join(staticDir, f);
    const dest = path.join(dist, f);
    fs.copyFileSync(src, dest);
    console.log(`✔ static/${f} → dist/${f}`);
  }
}

const tailwindOut = path.join(dist, "tailwind.css");
const tailwindCli = path.join(
  root,
  "node_modules",
  "tailwindcss",
  "lib",
  "cli.js",
);
execFileSync(
  process.execPath,
  [
    tailwindCli,
    "-i",
    path.join(src, "styles.css"),
    "-o",
    tailwindOut,
    "--minify",
  ],
  { cwd: root, stdio: "inherit" },
);
const tailwindCss = fs.readFileSync(tailwindOut, "utf8");

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
    define: { __BET_ANALYZER_CSS__: JSON.stringify(tailwindCss) },
    outfile: path.join(dist, `bookmarklet-${id}.js`),
  });
  const code = fs.readFileSync(path.join(dist, `bookmarklet-${id}.js`), "utf8");
  const url = "javascript:" + encodeURIComponent(code);
  fs.writeFileSync(path.join(dist, `bookmarklet-${id}.txt`), url, "utf8");
  bookmarklets.push({ id, code, url });
  const kb = (code.length / 1024).toFixed(1);
  const warn = code.length > 32000 ? "  ⚠ >32KB (may not work in Safari)" : "";
  console.log(
    `✔ bookmarklet-${id}.js  ${kb} KB minified, URL ${url.length} chars${warn}`,
  );
}

// 2) Demo + verify bundles (Node-importable ESM) -------------------
const demoBundle = path.join(dist, ".demo-bundle.mjs");
const verifyBundle = path.join(dist, ".verify-bundle.mjs");
await build({
  entryPoints: [path.join(entriesDir, "demo.ts")],
  bundle: true,
  format: "esm",
  target: ["node18"],
  define: { __BET_ANALYZER_CSS__: JSON.stringify(tailwindCss) },
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
  console.log(
    "ℹ no bets_raw.json at project root — skipping core verification",
  );
}

// 4) Install / landing page ---------------------------------------
const tplPath = path.join(root, "template", "install.html");
const tpl = fs.readFileSync(tplPath, "utf8");
const escHtml = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Display name used in the page copy for each provider. `auto` is the single
// self-detecting bookmarklet, so its copy name lists the sites it covers.
const PROVIDER_NAMES = {
  auto: "SportyBet / football.com",
  football: "football.com",
  sportybet: "SportyBet",
};

// Shorter label used on the provider switcher tab itself.
const PROVIDER_TAB_NAMES = {
  auto: "Auto-detect",
  football: "football.com",
  sportybet: "SportyBet",
};

const primary =
  bookmarklets.find((b) => b.id === "auto") ||
  bookmarklets.find((b) => b.id === "football") ||
  bookmarklets[0];

// Options for the provider switcher on the install page (id, display name,
// full bookmarklet URL, and the raw code for the "copy" box).
const providerOptions = bookmarklets.map((b) => ({
  id: b.id,
  name: PROVIDER_NAMES[b.id] || b.id,
  href: b.url,
  code: b.code,
}));

// Render one pill tab per provider. The auto-detect tab is first and gets a
// hint explaining it covers every site.
const providerTabs = bookmarklets
  .map((b, i) => {
    const label = PROVIDER_TAB_NAMES[b.id] || PROVIDER_NAMES[b.id] || b.id;
    const hint =
      b.id === "auto"
        ? ' title="One bookmarklet — picks SportyBet or football.com automatically"'
        : "";
    const badge =
      b.id === "auto"
        ? ' <span class="ba-provider-badge" aria-hidden="true">1 bookmark for all</span>'
        : "";
    return `<button type="button" class="ba-provider-tab" data-provider="${b.id}" aria-pressed="false"${hint}>${label}${badge}</button>`;
  })
  .join("");

let html = tpl;
if (primary) {
  html = html.split("{{BOOKMARKLET_HREF}}").join(primary.url);
  html = html.split("{{BOOKMARKLET_CODE}}").join(escHtml(primary.code));
} else {
  html = html.split("{{BOOKMARKLET_HREF}}").join("#");
  html = html.split("{{BOOKMARKLET_CODE}}").join("(no provider built)");
}
html = html
  .split("{{PROVIDER_NAME}}")
  .join(primary ? PROVIDER_NAMES[primary.id] || primary.id : "your bookmaker");
html = html.split("{{PROVIDER_TABS}}").join(providerTabs);
// Escape "<" in the JSON so "</script>" sequences can't break the inline script.
html = html
  .split("{{PROVIDER_OPTIONS_JSON}}")
  .join(JSON.stringify(providerOptions).replace(/</g, "\\u003c"));
html = html.split("{{BUILD_DATE}}").join(new Date().toISOString().slice(0, 10));
html = html.split("{{DEMO_HREF}}").join("demo.html");
html = html.split("{{DEMO_SHOT}}").join("demo-dashboard.png");
html = html.split("{{TAILWIND_CSS}}").join(tailwindCss);
fs.writeFileSync(path.join(dist, "index.html"), html, "utf8");
console.log("✔ index.html (install page)");
console.log(
  `  providers: ${providerOptions.map((p) => `${p.name} (bookmarklet-${p.id}.js, ${(p.href.length / 1024).toFixed(1)} KB URL)`).join(" · ")}`,
);

// Clean up temp bundles
fs.rmSync(demoBundle, { force: true });
fs.rmSync(verifyBundle, { force: true });

console.log("\nDone → web/dist/ (host this folder)");
