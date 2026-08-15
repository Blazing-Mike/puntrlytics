// localStorage-backed report store shared by the /dashboard pages (same
// origin, so all of them see the same saved reports).

import type { Report } from "./core";

export interface StoredReport {
  id: string;
  providerName: string;
  currency: string;
  savedAt: string;
  report: Report;
}

export const REPORTS_KEY = "betlytics:reports";
export const MAX_SAVED = 50;

export function loadReports(): StoredReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as StoredReport[]) : [];
  } catch {
    return [];
  }
}

export function saveReport(rep: StoredReport): StoredReport[] {
  const list = [rep, ...loadReports()].slice(0, MAX_SAVED);
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
  } catch {
    /* storage full / blocked — non-fatal */
  }
  return list;
}

export function deleteReport(id: string): StoredReport[] {
  const list = loadReports().filter((r) => r.id !== id);
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
  } catch {
    /* non-fatal */
  }
  return list;
}

export function newReportId(): string {
  return (
    "r" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)
  );
}
