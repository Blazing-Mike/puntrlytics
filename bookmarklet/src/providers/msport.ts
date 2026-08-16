// MSport provider — MSport's backend is a clone/derivative of the SportyBet
// engine, so it uses the same realbetlist API but with different keys for
// pagination and the items list.

import { createRealBetListProvider } from "./realbetlist";
import { getProvider } from "./registry";

const meta = getProvider("msport")!;

export const msportProvider = createRealBetListProvider({
  id: meta.id,
  name: meta.name,
  currency: meta.currency,
  apiBase: meta.apiBase,
  baseParams: meta.baseParams,
  cacheBuster: meta.cacheBuster,
  listKey: meta.listKey,
  totalKey: meta.totalKey,
  pageParam: meta.pageParam,
  sizeParam: meta.sizeParam,
  headers: () => {
    let operId = "2"; // fallback
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/operId=([^;]+)/);
      if (match) operId = match[1];
    }
    if (typeof localStorage !== "undefined" && !document.cookie.includes("operId=")) {
      operId = localStorage.getItem("operId") || operId;
    }
    return { operId };
  },
});
