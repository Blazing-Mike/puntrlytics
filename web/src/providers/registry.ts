// Provider registry — single source of truth for the realbetlist providers.
// Shared by the bookmarklet providers (sportybet.ts / football.ts) so the API
// URLs and query params never drift between them.

export interface ProviderMeta {
  id: string;
  name: string;
  currency: string;
  apiBase: string;
  baseParams?: Record<string, string | number>;
  cacheBuster?: string;
  /** Origin the user must be logged into (used by the token guide). */
  origin: string;
  /** Custom headers the site's API expects (clientid/operid/platform). */
  apiHeaders?: Record<string, string>;
  /** Referer the site sends when calling the API (may be validated). */
  referer?: string;
}

export const PROVIDERS: Record<string, ProviderMeta> = {
  sportybet: {
    id: "sportybet",
    name: "SportyBet",
    currency: "NGN",
    apiBase: "https://www.sportybet.com/api/ng/orders/order/v2/realbetlist",
    baseParams: { isSettled: "10" },
    cacheBuster: "_t",
    origin: "https://www.sportybet.com",
    apiHeaders: { clientid: "web", operid: "2", platform: "web" },
    referer:
      "https://www.sportybet.com/ng/my_accounts/bet_history/sport_bets?isSettled=10",
  },
  football: {
    id: "football",
    name: "football.com",
    currency: "NGN",
    apiBase: "https://www.football.com/api/ng/orders/order/v2/realbetlist",
    origin: "https://www.football.com",
    apiHeaders: { clientid: "web", operid: "2", platform: "web" },
    referer:
      "https://www.football.com/ng/my_accounts/bet_history/sport_bets?isSettled=10",
  },
};

export function getProvider(id: string | undefined): ProviderMeta | undefined {
  return PROVIDERS[String(id || "").toLowerCase()];
}