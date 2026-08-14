// Picks the right provider for the site the bookmarklet is currently running
// on. This lets us ship ONE bookmarklet that works on every supported
// bookmaker instead of one bookmarklet per site.
//
// Matching is by hostname suffix (case-insensitive) so regional subdomains
// (e.g. "sports.sportybet.com") also resolve to the right provider.

import type { Provider } from "../core";
import { footballProvider } from "./football";
import { sportybetProvider } from "./sportybet";

const RULES: ReadonlyArray<{ suffix: string; provider: Provider }> = [
  { suffix: "sportybet.com", provider: sportybetProvider },
  { suffix: "football.com", provider: footballProvider },
];

export function detectProvider(hostname?: string): Provider | null {
  const host = (
    hostname || (typeof location !== "undefined" ? location.hostname : "")
  ).toLowerCase();
  if (!host) return null;
  for (const rule of RULES) {
    if (host === rule.suffix || host.endsWith("." + rule.suffix)) {
      return rule.provider;
    }
  }
  return null;
}
