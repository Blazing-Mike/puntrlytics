import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import type { Report, Bet } from "./core";

export interface StoredReport {
  id: string;
  providerName: string;
  currency: string;
  savedAt: string;
  report: Report;
  bets?: Bet[];
}

interface AppState {
  reports: StoredReport[];
  activeId: string | null;
  
  setPayload: (payload: { report: Report; bets?: Bet[]; providerName?: string; currency?: string; savedAt?: string }) => void;
  setActiveId: (id: string) => void;
  deleteReport: (id: string) => void;
  clear: () => void;
}

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (setStore) => ({
      reports: [],
      activeId: null,

      setPayload: (payload) =>
        setStore((state) => {
          const newReport: StoredReport = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            report: payload.report,
            bets: payload.bets,
            providerName: payload.providerName || "Auto",
            currency: payload.currency || "NGN",
            savedAt: payload.savedAt || new Date().toISOString(),
          };
          // One report per provider. The bookmarklet reads the account's full
          // bet history on every run, so a fresh import from a site is a
          // superset of any earlier report from it — replace the old one
          // instead of stacking, which would double-count net profit in the
          // global stats.
          const key = newReport.providerName.toLowerCase();
          const others = state.reports.filter(
            (r) => r.providerName.toLowerCase() !== key,
          );
          return {
            reports: [newReport, ...others].slice(0, 50), // keep last 50
            activeId: newReport.id,
          };
        }),

      setActiveId: (id) => setStore({ activeId: id }),
      
      deleteReport: (id) => setStore((state) => {
        const newReports = state.reports.filter((r) => r.id !== id);
        return {
          reports: newReports,
          activeId: state.activeId === id ? (newReports[0]?.id || null) : state.activeId
        };
      }),

      clear: () => setStore({ reports: [], activeId: null }),
    }),
    {
      name: "bet-analyzer-storage",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
