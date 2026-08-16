import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, "src");
const entriesDir = path.join(src, "entries");
const libDir = path.join(root, "..", "src", "lib");
const publicDir = path.join(root, "..", "public", "bookmarklets");

fs.mkdirSync(publicDir, { recursive: true });

const entries = fs
  .readdirSync(entriesDir)
  .filter((f) => f.endsWith(".ts"))
  .filter((f) => !["demo.ts", "verify.ts", "dashboard.ts"].includes(f))
  .sort();

const HOST =
  process.env.BOOKMARKLET_HOST ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  "http://localhost:3000";
const formattedHost = HOST
  ? (HOST.startsWith("http") ? HOST : `https://${HOST}`).replace(/\/+$/, "")
  : "";

const bookmarklets = [];
const PROVIDER_NAMES = {
  auto: "SportyBet / MSport / Stake / football.com",
  football: "football.com",
  sportybet: "SportyBet",
  msport: "MSport",
  stake: "Stake.com"
};

for (const f of entries) {
  const id = f.replace(/\.ts$/, "");
  await build({
    entryPoints: [path.join(entriesDir, f)],
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2019"],
    define: {
      __BET_ANALYZER_HOST__: JSON.stringify(formattedHost),
    },
    outfile: path.join(publicDir, `bookmarklet-${id}.js`),
  });
  const code = fs.readFileSync(path.join(publicDir, `bookmarklet-${id}.js`), "utf8");
  const url = "javascript:" + encodeURIComponent(code);
  
  bookmarklets.push({
    id,
    name: PROVIDER_NAMES[id] || id,
    code,
    url,
  });
  
  fs.writeFileSync(path.join(publicDir, `bookmarklet-${id}.txt`), url, "utf8");
  console.log(`✔ bookmarklet-${id}.js (${(code.length / 1024).toFixed(1)} KB)`);
}

// Generate an auto-updating loader if HOST is set
let loaderUrl = "";
let loaderCode = "";
if (formattedHost) {
  fs.copyFileSync(
    path.join(publicDir, "bookmarklet-auto.js"),
    path.join(publicDir, "bookmarklet-runtime.js"),
  );
  loaderCode =
    '(function(){var s=document.createElement("script");' +
    's.src="' +
    formattedHost +
    '/bookmarklets/bookmarklet-runtime.js?_="+Date.now();' +
    's.onerror=function(){alert("[Bet Analyzer] Could not load the latest script.");};' +
    "(document.body||document.documentElement).appendChild(s);})();";
  loaderUrl = "javascript:" + encodeURIComponent(loaderCode);
  
  fs.writeFileSync(path.join(publicDir, "bookmarklet-loader.txt"), loaderUrl, "utf8");
  
  bookmarklets.unshift({
    id: "loader",
    name: "Auto-update loader",
    code: loaderCode,
    url: loaderUrl
  });
  console.log(`✔ auto-updating loader generated`);
}

fs.writeFileSync(
  path.join(libDir, "bookmarklets-data.json"),
  JSON.stringify({ host: formattedHost, bookmarklets }, null, 2),
  "utf8"
);
console.log("✔ src/lib/bookmarklets-data.json generated");
