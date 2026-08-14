// football.com provider — same "realbetlist" JSON API as SportyBet, so it's
// built from the shared factory. Fetches every page of the user's bet history
// using the logged-in session (the page itself loads more bets as you scroll).

import { createRealBetListProvider } from "./realbetlist";

export const footballProvider = createRealBetListProvider({
  id: "football",
  name: "football.com",
  currency: "NGN",
  apiBase: "https://www.football.com/api/ng/orders/order/v2/realbetlist",
});
