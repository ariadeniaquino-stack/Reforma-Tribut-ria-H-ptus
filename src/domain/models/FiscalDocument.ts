// ─────────────────────────────────────────────────────────────
// Domínio — Tipos centrais do documento fiscal
// Reforma Tributária do Consumo (LC 214/2025) — IBS/CBS
// ─────────────────────────────────────────────────────────────

export type DocumentType = "NFE" | "NFCE" | "CTE" | "NFSE" | "UNKNOWN";

export type TaxRegime = "SIMPLES_NACIONAL" | "MEI" | "RPA" | "UNKNOWN";

export type Direction = "INBOUND" | "OUTBOUND" | "UNKNOWN";

export type Purpose = "NORMAL" | "COMPLEMENTAR" | "AJUSTE" | "DEVOLUCAO";

export type DocumentStatus = "VALID" | "CANCELLED" | "DENIED";

/** Impacto do item na apuração do declarante. */
export type RtcImpact = "CREDIT" | "DEBIT" | "NEUTRAL" | "NONE";

export interface Party {
  cnpj_cpf: string;
  name: string;
  uf?: string;
}

export interface ItemTaxesCurrent {
  // NF-e / CT-e (tributos do sistema atual)
  icms_cst?: string;
  icms_base?: number;
  icms_rate?: number;
  icms_value?: number;
  pis_cst?: string;
  pis_value?: number;
  cofins_cst?: string;
  cofins_value?: number;
  ipi_cst?: string;
  ipi_value?: number;
  // NFS-e Nacional
  iss_base?: number;
  iss_rate?: number;
  iss_value?: number;
  iss_retained?: boolean;
  ir_value?: number;
  csll_value?: number;
  inss_value?: number;
}

/** Campos IBS/CBS introduzidos pela Reforma. */
export interface RtcFields {
  cst?: string;
  c_class_trib?: string;
  vBC?: number;
  pIBSUF?: number;
  vIBSUF?: number;
  pIBSMun?: number;
  vIBSMun?: number;
  vIBS?: number;
  pCBS?: number;
  vCBS?: number;
}

export interface FiscalItem {
  item_number: number;
  description: string;
  cfop: string;
  ncm: string;
  gross_value: number;
  discount_value: number;
  net_value: number;
  taxes_current: ItemTaxesCurrent;
  rtc: RtcFields;
  rtc_impact: RtcImpact;
}

export interface DocumentTotals {
  vProd?: number;
  vDesc?: number;
  vFrete?: number;
  vTotTrib?: number;
  vICMS?: number;
  vPIS?: number;
  vCOFINS?: number;
  vISS?: number;
  vISSRet?: number;
  vBCIBSCBS?: number;
  vIBS?: number;
  vCBS?: number;
  [key: string]: number | undefined;
}

export interface FiscalDocument {
  access_key: string;
  document_type: DocumentType;
  version: string;
  issue_date: string; // ISO 8601
  purpose: Purpose;
  tax_regime: TaxRegime;
  direction: Direction;
  issuer: Party;
  receiver: Party;
  sender?: Party; // CT-e: remetente
  total_value: number;
  totals: DocumentTotals;
  items: FiscalItem[];
  status: DocumentStatus;
  municipality_code?: string;
  source_filename: string;
  referenced_keys?: string[];
  /** Mantido em memória, NUNCA transmitido a serviços externos. */
  raw_xml: string;
}

/** Resultado da apuração de um conjunto de documentos. */
export interface ApuracaoResult {
  credito: number;
  debito: number;
  saldo: number;
  totalCompras: number;
  totalVendas: number;
  creditRate: number; // % carga s/ compras
  debitRate: number; // % carga s/ vendas
  balanceRate: number; // % efeito líquido s/ vendas
  position: "CREDORA" | "DEVEDORA" | "NEUTRA";
}
