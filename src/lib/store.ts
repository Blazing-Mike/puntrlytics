import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Report } from "./core";

export interface StoredReport {
  id: string;
  providerName: string;
  currency: string;
  savedAt: string;
  report: Report;
}

interface AppState {
  reports: StoredReport[];
  activeId: string | null;
  
  setPayload: (payload: { report: Report; providerName?: string; currency?: string; savedAt?: string }) => void;
  setActiveId: (id: string) => void;
  deleteReport: (id: string) => void;
  clear: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      reports: [],
      activeId: null,

      setPayload: (payload) =>
        set((state) => {
          const newReport: StoredReport = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            report: payload.report,
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

      setActiveId: (id) => set({ activeId: id }),
      
      deleteReport: (id) => set((state) => {
        const newReports = state.reports.filter((r) => r.id !== id);
        return {
          reports: newReports,
          activeId: state.activeId === id ? (newReports[0]?.id || null) : state.activeId
        };
      }),

      clear: () => set({ reports: [], activeId: null }),
    }),
    {
      name: "bet-analyzer-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
