import { type Provider, type Bet, fetchJson, parseDate } from "../../../src/lib/core";

const STAKE_GRAPHQL_URL = "https://stake.com/_api/graphql";

// Mirrors the site's own SportSportList request (operation name, user(name:),
// status filter) so our call is indistinguishable from the web app's.
const BET_HISTORY_QUERY = `
query SportSportList($limit: Int!, $offset: Int!, $name: String, $status: [SportBetStatusEnum!]) {
  user(name: $name) {
    id
    name
    sportBetList(limit: $limit, offset: $offset, status: $status) {
      id
      iid
      bet {
        ... on SportBet {
          id
          amount
          currency
          status
          payout
          payoutMultiplier
          potentialMultiplier
          createdAt
          updatedAt
          outcomes {
            odds
            status
            outcome {
              name
              payout
            }
            fixture {
              name
              tournament {
                name
                category {
                  sport {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

// --- Stake session token ---------------------------------------------
// Stake's x-access-token is short-lived and only valid once the app has
// bootstrapped an authenticated session (e.g. on /my-bets/sports or settings).
// Running the bookmarklet on an idle page therefore usually gets a stale or
// absent token -> "You are not allowed to do that." So we try, in order:
//   1. known storage keys (incl. the manual override puntrlytics_stake_token)
//   2. a scan of every storage value for JWT-shaped / long opaque strings
//   3. sniffing the current page's OWN GraphQL traffic for a live token
//   4. opening a same-origin popup on /my-bets/sports — the route where a
//      fresh token is minted — and capturing it from the app's requests in
//      that window (a real top-level context: Stake's SPA disables its data
//      layer inside iframes, but treats a popup as a normal page).
// A wrong token fails fast with a permission error, so each candidate is
// tried against the real query until one works.

function readStoredTokens(): string[] {
  const keys = [
    "puntrlytics_stake_token",
    // Legacy key — keep reading it so overrides set under the old name still work.
    "betlytics_stake_token",
    "token",
    "access_token",
    "accessToken",
    "session",
  ];
  const out: string[] = [];
  for (const key of keys) {
    for (const store of [localStorage, sessionStorage]) {
      try {
        const raw = store.getItem(key);
        if (!raw) continue;
        let value = raw;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            if (typeof parsed.token === "string" && parsed.token)
              value = parsed.token;
            else if (
              typeof parsed.accessToken === "string" &&
              parsed.accessToken
            )
              value = parsed.accessToken;
            else continue; // JSON object without a token field — not it
          } else if (typeof parsed === "string") {
            value = parsed;
          }
        } catch {
          // Not JSON — use the raw string
        }
        // Real x-access-tokens are long; short values are garbage like "null".
        if (value && value.length > 8) out.push(value);
      } catch {
        // ignore
      }
    }
  }
  return [...new Set(out)];
}

// The app may keep the token under an unpredictable key — scan every storage
// value for JWT-shaped strings, or long opaque values under a key that hints
// at a credential (avoids trying random user data like bet IDs).
function scanStorageForTokens(): string[] {
  const KEY_HINT = /token|session|auth|jwt|credential/i;
  const out: string[] = [];
  const collect = (store: Storage | null): void => {
    if (!store) return;
    for (let i = 0; i < store.length; i++) {
      try {
        const k = store.key(i);
        if (!k) continue;
        const v = store.getItem(k);
        if (!v || v.length > 4096) continue;
        const isJwt = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v);
        const isOpaque = /^[A-Za-z0-9_-]+$/.test(v) && v.length >= 24;
        if (isJwt || (isOpaque && KEY_HINT.test(k))) out.push(v);
      } catch {
        // ignore
      }
    }
  };
  collect(localStorage);
  collect(sessionStorage);
  return [...new Set(out)];
}

// Temporarily patch the current page's fetch/XHR to capture the x-access-token
// from the site's own GraphQL requests (the app polls balance/odds on active
// pages), then restore. Returns "" if nothing shows up within timeoutMs.
function captureTokenFromTraffic(timeoutMs = 4000): Promise<string> {
  return new Promise<string>((resolve) => {
    const origFetch = window.fetch.bind(window);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const origOpen: any = XMLHttpRequest.prototype.open;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const origSend: any = XMLHttpRequest.prototype.send;

    let captured = false;
    const finish = (token: string) => {
      if (captured) return;
      captured = true;
      clearTimeout(timer);
      window.fetch = origFetch;
      XMLHttpRequest.prototype.open = origOpen;
      XMLHttpRequest.prototype.send = origSend;
      resolve(token);
    };
    const timer = setTimeout(() => finish(""), timeoutMs);

    window.fetch = (input: any, init?: RequestInit): Promise<Response> => {
      try {
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : "";
        if (url.includes("/_api/graphql")) {
          const hdrs: any = init?.headers;
          const token =
            hdrs instanceof Headers
              ? hdrs.get("x-access-token") || ""
              : hdrs && typeof hdrs === "object"
                ? hdrs["x-access-token"] || ""
                : "";
          if (token) finish(token);
        }
      } catch {
        // ignore
      }
      return origFetch(input, init);
    };

    XMLHttpRequest.prototype.open = function (
      this: any,
      method: string,
      url: string | URL,
      ...rest: any[]
    ) {
      this.__baUrl = String(url);
      return origOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function (this: any, ...args: any[]) {
      try {
        if (String(this.__baUrl || "").includes("/_api/graphql")) {
          const token =
            this.getRequestHeader && this.getRequestHeader("x-access-token");
          if (token) finish(token);
        }
      } catch {
        // ignore
      }
      return origSend.apply(this, args);
    };
  });
}

// Opens a same-origin popup on /my-bets/sports — the route where Stake mints a
// fresh token — and captures the x-access-token from the app's own requests in
// that window. It's a REAL top-level browsing context, so the SPA boots and
// polls normally (an iframe works too, but Stake's app skips its data layer
// when embedded). Same-origin means we can patch the popup's fetch/XHR before
// its scripts run and read its storage. Returns "" on timeout / if blocked.
function captureTokenFromPopup(timeoutMs = 20000): Promise<string> {
  return new Promise<string>((resolve) => {
    let done = false;
    let graphqlSeen = 0;
    let popup: Window | null = null;

    const finish = (token: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        popup?.close();
      } catch {
        // ignore
      }
      try {
        window.focus();
      } catch {
        // ignore
      }
      resolve(token);
    };

    const timer = setTimeout(() => {
      console.warn(
        graphqlSeen > 0
          ? "[Puntrlytics] Refresh window made GraphQL calls but no x-access-token header was seen."
          : "[Puntrlytics] Refresh window did not boot the app (or it made no GraphQL requests).",
      );
      finish("");
    }, timeoutMs);

    try {
      popup = window.open(
        window.location.origin + "/my-bets/sports",
        "puntrlytics_refresh",
        "width=480,height=640,left=-2000,top=0",
      );
    } catch {
      // ignore
    }
    if (!popup) {
      console.warn("[Puntrlytics] Could not open the refresh window (popup blocked?).");
      finish("");
      return;
    }
    try {
      popup.moveTo(-2000, 0);
      popup.blur();
      window.focus();
    } catch {
      // ignore
    }

    popup.addEventListener("load", () => {
      try {
        console.log("[Puntrlytics] Refresh window loaded: " + popup.location.href);
      } catch {
        // ignore
      }
    });

    try {
      const origFetch = popup.fetch.bind(popup);
      popup.fetch = (input: any, init?: RequestInit): Promise<Response> => {
        try {
          const url =
            typeof input === "string"
              ? input
              : input instanceof Request
                ? input.url
                : "";
          if (url.includes("/_api/graphql")) {
            graphqlSeen++;
            const hdrs: any = init?.headers;
            const token =
              hdrs instanceof Headers
                ? hdrs.get("x-access-token") || ""
                : hdrs && typeof hdrs === "object"
                  ? hdrs["x-access-token"] || ""
                  : "";
            if (token) finish(token);
          }
        } catch {
          // ignore
        }
        return origFetch(input, init);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const winXhr: any = (popup as any).XMLHttpRequest;
      if (winXhr && winXhr.prototype) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const origOpen: any = winXhr.prototype.open;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const origSend: any = winXhr.prototype.send;
        winXhr.prototype.open = function (
          this: any,
          method: string,
          url: string | URL,
          ...rest: any[]
        ) {
          this.__baUrl = String(url);
          return origOpen.call(this, method, url, ...rest);
        };
        winXhr.prototype.send = function (this: any, ...args: any[]) {
          try {
            if (String(this.__baUrl || "").includes("/_api/graphql")) {
              graphqlSeen++;
              const token =
                this.getRequestHeader &&
                this.getRequestHeader("x-access-token");
              if (token) finish(token);
            }
          } catch {
            // ignore
          }
          return origSend.apply(this, args);
        };
      }
    } catch {
      // ignore
    }
  });
}

export const stakeProvider: Provider = {
  id: "stake",
  name: "Stake",
  currency: "", // Will be extracted from the first bet

  async fetchBets(progress?: (msg: string) => void): Promise<Bet[]> {
    const limit = 40;

    const isPermissionError = (err: unknown): boolean =>
      err instanceof Error && /not allowed|permission/i.test(err.message);

    // Paginated read for a given token.
    const fetchAll = async (token: string): Promise<Bet[]> => {
      const allBets: Bet[] = [];
      let offset = 0;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      if (token) headers["x-access-token"] = token;

      while (true) {
        if (progress) progress(`Fetching bets... (${allBets.length} loaded)`);

        const payload = {
          operationName: "SportSportList",
          query: BET_HISTORY_QUERY,
          variables: {
            limit,
            offset,
            name: null,
            status: [
              "settled",
              "settledManual",
              "settledPending",
              "cancelPending",
              "cancelled",
              "cashout",
              "cashoutPending",
            ],
          },
        };

        const res = (await fetchJson(STAKE_GRAPHQL_URL, undefined, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        })) as any;

        // GraphQL returns HTTP 200 even on auth failures — surface the errors.
        if (res?.errors && res.errors.length > 0) {
          const msg = res.errors
            .map((e: any) => e.message || JSON.stringify(e))
            .join("; ");
          throw new Error(
            `Stake API error: ${msg}${token ? " (token rejected)" : " (no token)"}`,
          );
        }

        const sportBetList = res?.data?.user?.sportBetList;
        if (
          !sportBetList ||
          !Array.isArray(sportBetList) ||
          sportBetList.length === 0
        ) {
          break; // No more bets
        }

        for (const item of sportBetList) {
          const b = item.bet;
          if (!b) continue;

          // Extract currency from first bet (API sends lowercase, e.g. "ngn")
          if (!this.currency && b.currency) {
            this.currency = String(b.currency).toUpperCase();
          }

          const stake = Number(b.amount) || 0;
          let payout = Number(b.payout);
          if (isNaN(payout) && b.payoutMultiplier !== undefined) {
            payout = stake * Number(b.payoutMultiplier);
          }

          // Outcomes
          const outcomes = b.outcomes || [];
          const isWinning = payout > 0;
          const totalOdds =
            Number(b.potentialMultiplier) ||
            (stake > 0 ? payout / stake : 1.0) ||
            1.0;

          // Map the API's status vocabulary onto the report's: settled*/cashout
          // are final (Won/Lost by payout), cancelled* are voids, and pending
          // statuses are skipped so they don't skew win-rate/ROI.
          const st = String(b.status || "").toLowerCase();
          let status: string;
          if (st === "settled" || st === "settledManual" || st === "cashout") {
            status = isWinning ? "Won" : "Lost";
          } else if (st === "cancelled" || st === "cancelPending") {
            status = "Void";
          } else {
            continue; // pending / not final
          }

          // Derive sport / tournament from the selections (unique values,
          // "Mixed" when a bet spans several — same convention as the
          // realbetlist providers).
          const uniq = (arr: string[]): string[] => Array.from(new Set(arr));
          const sports = outcomes
            .map((o: any) => o?.fixture?.tournament?.category?.sport?.name || "")
            .filter(Boolean);
          const tournaments = outcomes
            .map((o: any) => o?.fixture?.tournament?.name || "")
            .filter(Boolean);
          const uSports = uniq(sports);
          const uTournaments = uniq(tournaments);

          const bet: Bet = {
            betId: String(b.id || item.id),
            stake,
            payout,
            odds: totalOdds,
            date: parseDate(
              b.createdAt || b.updatedAt || new Date().toISOString(),
            ),
            status,
            betType: outcomes.length > 1 ? "Multiple" : "Single",
            sport:
              uSports.length === 0
                ? ""
                : uSports.length === 1
                  ? uSports[0]
                  : "Mixed",
            tournament:
              uTournaments.length === 0
                ? ""
                : uTournaments.length === 1
                  ? uTournaments[0]
                  : "Mixed",
          };

          allBets.push(bet);
        }

        if (sportBetList.length < limit) {
          break;
        }
        offset += limit;
      }

      if (progress) progress(`Loaded all ${allBets.length} settled bets!`);
      return allBets;
    };

    // 1) Fast path: try known/plausible tokens. A wrong token fails fast with
    //    a permission error, so move to the next candidate.
    const candidates = [
      ...new Set([...readStoredTokens(), ...scanStorageForTokens()]),
    ];
    let lastError: unknown = null;
    for (const token of candidates) {
      try {
        console.log(
          `[Puntrlytics] Trying Stake token: ${token.slice(0, 8)}… (${token.length} chars)`,
        );
        return await fetchAll(token);
      } catch (err) {
        lastError = err;
        if (!isPermissionError(err)) throw err;
        console.warn(`[Puntrlytics] Token ${token.slice(0, 8)}… rejected.`);
      }
    }

    // 2) None worked — make the app mint a fresh token, exactly like visiting
    //    /my-bets/sports does: sniff the page's own traffic, then open the app
    //    in a same-origin popup on that route and capture its token.
    if (progress) progress("Refreshing session token from the site…");
    let fresh = await captureTokenFromTraffic(4000);
    if (!fresh) fresh = await captureTokenFromPopup();
    // The app may have written a fresh token to storage while booting.
    if (!fresh) {
      fresh =
        [...readStoredTokens(), ...scanStorageForTokens()].filter(
          (t) => !candidates.includes(t),
        )[0] || "";
    }
    if (fresh) {
      console.log(
        `[Puntrlytics] Fresh Stake token: ${fresh.slice(0, 8)}… (${fresh.length} chars)`,
      );
      try {
        return await fetchAll(fresh);
      } catch (err) {
        lastError = err;
        if (!isPermissionError(err)) throw err;
      }
    }

    console.warn(
      "[Puntrlytics] Could not obtain a valid Stake x-access-token. Open " +
        'DevTools → Network → filter "graphql" → _api/graphql → request ' +
        "headers, copy the x-access-token value, then run:\n" +
        '  localStorage.setItem("puntrlytics_stake_token", "<token>")\n' +
        "and re-run the bookmarklet.",
    );
    throw lastError instanceof Error
      ? lastError
      : new Error("Stake: no valid session token.");
  }
};
