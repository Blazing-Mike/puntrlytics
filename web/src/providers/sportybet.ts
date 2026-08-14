// SportyBet provider — same "realbetlist" JSON API as football.com, so it's
// built from the shared factory. The site's UI sends `isSettled=10` (settled
// history) plus a `_t` timestamp cache-buster; both are kept here.

import { createRealBetListProvider } from "./realbetlist";

export const sportybetProvider = createRealBetListProvider({
  id: "sportybet",
  name: "SportyBet",
  currency: "NGN",
  apiBase: "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
  baseParams: { isSettled: "10" },
  cacheBuster: "_t",
});
