// Bundles and runs the provider normalization tests against real API samples.
// Usage: npm run test:providers   (from web/)
import { buildSync } from "esbuild";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(root, "sportybet-test.ts");
const out = path.join(root, ".sportybet-test.mjs");

buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: out,
});

await import(pathToFileURL(out).href);
