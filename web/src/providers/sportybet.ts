// SportyBet provider — same "realbetlist" JSON API as football.com, so it's
// built from the shared factory. The site's UI sends `isSettled=10` (settled
// history) plus a `_t` timestamp cache-buster; both are kept in the registry.

import { createRealBetListProvider } from "./realbetlist";
import { getProvider } from "./registry";

const meta = getProvider("sportybet")!;

export const sportybetProvider = createRealBetListProvider({
  id: meta.id,
  name: meta.name,
  currency: meta.currency,
  apiBase: meta.apiBase,
  baseParams: meta.baseParams,
  cacheBuster: meta.cacheBuster,
});