"use client";

import { create } from "zustand";
import type { FiscalDocument } from "@/domain/models/FiscalDocument";
import { IngestService } from "@/application/services/IngestService";
import { TaxAnalyzerService } from "@/application/services/TaxAnalyzerService";

interface FiscalState {
  documents: FiscalDocument[];
  errors: Array<{ filename: string; message: string }>;
  isProcessing: boolean;
  addFiles: (files: File[]) => Promise<void>;
  removeDocument: (accessKey: string) => void;
  clear: () => void;
}

export const useFiscalStore = create<FiscalState>((set, get) => ({
  documents: [],
  errors: [],
  isProcessing: false,

  addFiles: async (files) => {
    set({ isProcessing: true });
    try {
      const { documents: parsed, errors } = await IngestService.ingest(files);
      // Dedupe por chave de acesso
      const existing = get().documents;
      const byKey = new Map<string, FiscalDocument>();
      for (const d of [...existing, ...parsed]) {
        byKey.set(d.access_key || `${d.source_filename}-${byKey.size}`, d);
      }
      const merged = TaxAnalyzerService.enrich(Array.from(byKey.values()));
      set((s) => ({
        documents: merged,
        errors: [...s.errors, ...errors],
        isProcessing: false,
      }));
    } catch (e) {
      set((s) => ({
        isProcessing: false,
        errors: [
          ...s.errors,
          { filename: "lote", message: e instanceof Error ? e.message : "Falha na ingestão" },
        ],
      }));
    }
  },

  removeDocument: (accessKey) => {
    const remaining = get().documents.filter((d) => d.access_key !== accessKey);
    set({ documents: TaxAnalyzerService.enrich(remaining) });
  },

  clear: () => set({ documents: [], errors: [] }),
}));
