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
          return {
            reports: [newReport, ...state.reports].slice(0, 50), // keep last 50
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
