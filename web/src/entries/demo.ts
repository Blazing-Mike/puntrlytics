// Builds the demo report page (used by build.mjs at build time).
import { computeReport } from "../core";
import { renderReport } from "../render";
import { sampleBets } from "../sample";

export function buildDemoHtml(): string {
  return renderReport(computeReport(sampleBets()), {
    providerName: "Sample data (demo)",
    currency: "NGN",
  });
}
