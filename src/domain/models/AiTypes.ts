// ─────────────────────────────────────────────────────────────
// Domínio — Tipos do módulo de IA (Dossiê Tributário)
// REGRA DE OURO: o AiContext NUNCA contém CNPJs, nomes ou chaves.
// ─────────────────────────────────────────────────────────────

import type { TaxRegime } from "./FiscalDocument";

export interface AiContext {
  period: string; // "Jan/26 – Mai/26"
  totalDocs: number;
  volumes: { inbound: number; outbound: number; total: number };
  ibscbs: {
    credito: number;
    debito: number;
    saldo: number;
    creditRate: number;
    debitRate: number;
    balanceRate: number;
  };
  byDocType: Array<{
    tipo: string;
    count: number;
    credito: number;
    debito: number;
  }>;
  byRegime: { rpa: number; simples: number; mei: number };
  inconformes: number;
  topCfops: Array<{ cfop: string; credito: number; debito: number }>;
  temporal: Array<{
    label: string;
    credito: number;
    debito: number;
    saldo: number;
  }>;
  companyRegime: TaxRegime | "UNKNOWN";
  purchaseProfile: {
    withCredits: number;
    neutral: number;
    creditCoverageRate: number;
  };
  salesProfile: { b2b: number; b2c: number; b2bRate: number };
}

export type GeminiModel =
  | "gemini-2.0-flash"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";

export interface AiSettings {
  model: GeminiModel;
  companyName: string;
  companyLogo: string | null; // base64
  maxOutputTokens: number;
}

export interface AiReportEntry {
  id: string;
  createdAt: string;
  regime: string;
  markdown: string;
}
