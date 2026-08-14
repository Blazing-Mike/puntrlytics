// Bundles and runs the provider normalization tests against real API samples,
// plus the URL-normalization regression test for the doubled-URL bug.
// Usage: npm run test:providers   (from web/)
import { buildSync } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

async function runTest(tsFile, mjsFile) {
  buildSync({
    entryPoints: [path.join(root, tsFile)],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: path.join(root, mjsFile),
  });
  await import(pathToFileURL(path.join(root, mjsFile)).href);
  fs.rmSync(path.join(root, mjsFile), { force: true });
}

await runTest("sportybet-test.ts", ".sportybet-test.mjs");
await runTest("url-normalize-test.ts", ".url-normalize-test.mjs");
await runTest("detect-test.ts", ".detect-test.mjs");
