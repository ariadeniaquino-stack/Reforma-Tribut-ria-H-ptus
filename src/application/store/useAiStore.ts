"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AiSettings, AiReportEntry, GeminiModel } from "@/domain/models/AiTypes";

interface AiState {
  settings: AiSettings;
  history: AiReportEntry[];
  setModel: (model: GeminiModel) => void;
  setCompanyName: (name: string) => void;
  setCompanyLogo: (logo: string | null) => void;
  addReport: (entry: AiReportEntry) => void;
  clearHistory: () => void;
}

const DEFAULT_SETTINGS: AiSettings = {
  model: "gemini-2.0-flash",
  companyName: "HAPTUS Assessoria Contábil",
  companyLogo: null,
  maxOutputTokens: 65536,
};

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      history: [],
      setModel: (model) => set((s) => ({ settings: { ...s.settings, model } })),
      setCompanyName: (companyName) =>
        set((s) => ({ settings: { ...s.settings, companyName } })),
      setCompanyLogo: (companyLogo) =>
        set((s) => ({ settings: { ...s.settings, companyLogo } })),
      addReport: (entry) => set((s) => ({ history: [entry, ...s.history].slice(0, 20) })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "rtc-ai-settings",
      partialize: (s) => ({ settings: s.settings, history: s.history }),
    },
  ),
);
