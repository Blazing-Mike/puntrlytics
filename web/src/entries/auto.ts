// Single "auto-detect" bookmarklet: works on every supported bookmaker.
// It picks the right provider from the site you're currently on, so there's
// one bookmarklet for all sites instead of one per site. The bookmarklet
// overlay labels which provider it picked (SportyBet vs football.com).

import { runBookmarklet } from "../bookmarklet";
import { detectProvider } from "../providers/detect";

const provider = detectProvider();
if (!provider) {
  const msg =
    "[Bet Analyzer] Unsupported site: " +
    (typeof location !== "undefined" ? location.hostname : "unknown") +
    "\n\nThis bookmarklet works on SportyBet and football.com. " +
    "Open one of those sites (logged in) and run it again.";
  console.error(msg);
  window.alert(msg);
} else {
  runBookmarklet(provider);
}
