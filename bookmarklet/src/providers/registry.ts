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
  listKey?: string;
  totalKey?: string;
  pageParam?: string;
  sizeParam?: string;
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
  msport: {
    id: "msport",
    name: "MSport",
    currency: "NGN",
    apiBase: "https://www.msport.com/api/ng/orders/real-sports/list",
    baseParams: { isHistory: "1" }, // from user payload
    pageParam: "pageNumber",
    sizeParam: "limit",
    listKey: "orders",
    totalKey: "totalCount",
    origin: "https://www.msport.com",
    referer: "https://www.msport.com/ng/web/my_bets/history/archived",
  },
};

const CURRENCIES: Record<string, string> = {
  ng: "NGN",
  gh: "GHS",
  ke: "KES",
  zm: "ZMW",
  tz: "TZS",
  ug: "UGX",
};

export function getProvider(id: string | undefined): ProviderMeta | undefined {
  const base = PROVIDERS[String(id || "").toLowerCase()];
  if (!base) return undefined;

  const provider = { ...base };

  // When running as a bookmarklet on the betting site, the URL will often
  // start with the country code (e.g. /ng/, /ke/, /gh/).
  if (typeof window !== "undefined" && window.location) {
    const match = window.location.pathname.match(/^\/([a-z]{2})\//i);
    if (match) {
      const countryCode = match[1].toLowerCase();
      
      // Set the currency dynamically based on the country code
      if (CURRENCIES[countryCode]) {
        provider.currency = CURRENCIES[countryCode];
      }

      // Rewrite the hardcoded /ng/ in API URLs to match the current country
      provider.apiBase = provider.apiBase.replace(/\/ng\//g, `/${countryCode}/`);
      if (provider.referer) {
        provider.referer = provider.referer.replace(/\/ng\//g, `/${countryCode}/`);
      }
    }
  }

  return provider;
}