// football.com provider — same "realbetlist" JSON API as SportyBet, so it's
// built from the shared factory. Fetches every page of the user's bet history
// using the logged-in session (the page itself loads more bets as you scroll).

import { createRealBetListProvider } from "./realbetlist";
import { getProvider } from "./registry";

const meta = getProvider("football")!;

export const footballProvider = createRealBetListProvider({
  id: meta.id,
  name: meta.name,
  currency: meta.currency,
  apiBase: meta.apiBase,
  baseParams: meta.baseParams,
  cacheBuster: meta.cacheBuster,
});