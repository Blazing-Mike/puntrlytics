// Exposes the analysis core to Node at build time so build.mjs can check
// that the shared math still matches the CLI analyzer on real data.
export { computeReport } from "../core";
