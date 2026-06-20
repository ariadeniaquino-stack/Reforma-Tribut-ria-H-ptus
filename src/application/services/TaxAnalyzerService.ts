// ─────────────────────────────────────────────────────────────
// Serviço de apuração IBS/CBS — lógica de negócio pura.
// Driver de crédito/débito = DIREÇÃO (INBOUND/OUTBOUND).
// CFOP só exclui operações não-comerciais. (SPEC_XML_MAPPING_v2)
// ─────────────────────────────────────────────────────────────

import type {
  ApuracaoResult,
  Direction,
  FiscalDocument,
  FiscalItem,
  RtcImpact,
} from "@/domain/models/FiscalDocument";
import { isExcludedCfop, cfopCategory } from "@/lib/cfop";
import { cnpjRoot, formatPeriodLabel } from "@/lib/utils";

const RTC_VIGENCIA = new Date("2026-01-01T00:00:00");

function itemRtcValue(item: FiscalItem): number {
  return (item.rtc.vIBS ?? 0) + (item.rtc.vCBS ?? 0);
}

export class TaxAnalyzerService {
  /** Valor IBS+CBS de um item. */
  static rtcValue(item: FiscalItem): number {
    return itemRtcValue(item);
  }

  /**
   * Determina a raiz de CNPJ do declarante (empresa analisada): a raiz que
   * aparece no maior número de documentos (como emitente ou destinatário).
   */
  static determineOwnerRoot(documents: FiscalDocument[]): string {
    const count = new Map<string, number>();
    for (const d of documents) {
      const roots = new Set<string>();
      const ir = cnpjRoot(d.issuer.cnpj_cpf);
      const rr = cnpjRoot(d.receiver.cnpj_cpf);
      if (ir) roots.add(ir);
      if (rr && d.receiver.cnpj_cpf !== "CONSUMIDOR_FINAL") roots.add(rr);
      for (const r of roots) count.set(r, (count.get(r) ?? 0) + 1);
    }
    let best = "";
    let max = -1;
    for (const [root, n] of count) {
      if (n > max) {
        max = n;
        best = root;
      }
    }
    return best;
  }

  /** Direção de um documento dada a raiz do declarante. */
  static directionFor(doc: FiscalDocument, ownerRoot: string): Direction {
    if (doc.document_type === "NFCE") return "OUTBOUND"; // consumidor é final
    const ir = cnpjRoot(doc.issuer.cnpj_cpf);
    const rr = cnpjRoot(doc.receiver.cnpj_cpf);
    if (ownerRoot && ir === ownerRoot) return "OUTBOUND";
    if (ownerRoot && rr === ownerRoot) return "INBOUND";
    return "UNKNOWN";
  }

  /** Impacto RTC de um item dada a direção do documento. */
  static impactFor(item: FiscalItem, direction: Direction): RtcImpact {
    if (isExcludedCfop(item.cfop)) return "NEUTRAL";
    const value = itemRtcValue(item);
    if (value <= 0) return "NONE"; // sem destaque → avaliado em conformidade
    if (direction === "INBOUND") return "CREDIT";
    if (direction === "OUTBOUND") return "DEBIT";
    return "NEUTRAL";
  }

  /**
   * Enriquatece os documentos: define direção e impacto de cada item.
   * Retorna NOVOS objetos (imutável).
   */
  static enrich(documents: FiscalDocument[]): FiscalDocument[] {
    const ownerRoot = this.determineOwnerRoot(documents);
    return documents.map((doc) => {
      const direction = this.directionFor(doc, ownerRoot);
      const items = doc.items.map((it) => ({
        ...it,
        rtc_impact: this.impactFor(it, direction),
      }));
      return { ...doc, direction, items };
    });
  }

  static calculateApuracao(documents: FiscalDocument[]): ApuracaoResult {
    let credito = 0;
    let debito = 0;
    let totalCompras = 0;
    let totalVendas = 0;

    for (const doc of documents) {
      if (doc.direction === "INBOUND") totalCompras += doc.total_value;
      if (doc.direction === "OUTBOUND") totalVendas += doc.total_value;
      for (const item of doc.items) {
        const v = itemRtcValue(item);
        if (item.rtc_impact === "CREDIT") credito += v;
        else if (item.rtc_impact === "DEBIT") debito += v;
      }
    }

    const saldo = credito - debito;
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      credito: round(credito),
      debito: round(debito),
      saldo: round(saldo),
      totalCompras: round(totalCompras),
      totalVendas: round(totalVendas),
      creditRate: totalCompras ? round((credito / totalCompras) * 100) : 0,
      debitRate: totalVendas ? round((debito / totalVendas) * 100) : 0,
      balanceRate: totalVendas ? round((saldo / totalVendas) * 100) : 0,
      position: saldo > 0 ? "CREDORA" : saldo < 0 ? "DEVEDORA" : "NEUTRA",
    };
  }

  /** Agrupa crédito/débito por CFOP (informativo). */
  static groupByCfop(documents: FiscalDocument[]) {
    const map = new Map<string, { credito: number; debito: number; category: string }>();
    for (const doc of documents) {
      for (const item of doc.items) {
        const cfop = item.cfop || "—";
        const entry = map.get(cfop) ?? { credito: 0, debito: 0, category: cfopCategory(cfop) };
        const v = itemRtcValue(item);
        if (item.rtc_impact === "CREDIT") entry.credito += v;
        else if (item.rtc_impact === "DEBIT") entry.debito += v;
        map.set(cfop, entry);
      }
    }
    return Array.from(map.entries())
      .map(([cfop, v]) => ({ cfop, ...v, total: v.credito + v.debito }))
      .filter((e) => e.total > 0)
      .sort((a, b) => b.total - a.total);
  }

  /** Agrupa por período (mensal ou trimestral). */
  static groupByPeriod(
    documents: FiscalDocument[],
    mode: "MONTHLY" | "QUARTERLY" = "MONTHLY",
  ) {
    const map = new Map<
      string, { sortKey: string; label: string; credito: number; debito: number }
    >();
    for (const doc of documents) {
      const d = new Date(doc.issue_date);
      if (Number.isNaN(d.getTime())) continue;
      let sortKey: string;
      let label: string;
      if (mode === "QUARTERLY") {
        const q = Math.floor(d.getMonth() / 3) + 1;
        sortKey = `${d.getFullYear()}-Q${q}`;
        label = `${q}T/${String(d.getFullYear()).slice(2)}`;
      } else {
        sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        label = formatPeriodLabel(doc.issue_date);
      }
      const entry = map.get(sortKey) ?? { sortKey, label, credito: 0, debito: 0 };
      for (const item of doc.items) {
        const v = itemRtcValue(item);
        if (item.rtc_impact === "CREDIT") entry.credito += v;
        else if (item.rtc_impact === "DEBIT") entry.debito += v;
      }
      map.set(sortKey, entry);
    }
    let acc = 0;
    return Array.from(map.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((e) => {
        const saldo = e.credito - e.debito;
        acc += saldo;
        return {
          label: e.label,
          credito: Math.round(e.credito * 100) / 100,
          debito: Math.round(e.debito * 100) / 100,
          saldo: Math.round(saldo * 100) / 100,
          acumulado: Math.round(acc * 100) / 100,
        };
      });
  }

  /**
   * Documentos inconformes: deveriam destacar IBS/CBS e não destacaram.
   * Critérios (SPEC_BUSINESS_RULES §5): pós-2026, regime RPA, CFOP comercial,
   * IBS+CBS == 0.
   */
  static getInconformes(documents: FiscalDocument[]): Array<{
    doc: FiscalDocument;
    reason: string;
  }> {
    const out: Array<{ doc: FiscalDocument; reason: string }> = [];
    for (const doc of documents) {
      const issued = new Date(doc.issue_date);
      if (!Number.isNaN(issued.getTime()) && issued < RTC_VIGENCIA) continue; // pré-vigência
      if (doc.tax_regime === "SIMPLES_NACIONAL" || doc.tax_regime === "MEI") continue;
      if (doc.direction === "UNKNOWN") continue;

      const hasCommercialItem = doc.items.some((it) => !isExcludedCfop(it.cfop));
      if (!hasCommercialItem) continue;

      const totalRtc = doc.items.reduce((s, it) => s + itemRtcValue(it), 0);
      if (totalRtc > 0) continue;

      out.push({
        doc,
        reason:
          doc.direction === "INBOUND"
            ? "Fornecedor em Regime Normal não destacou IBS/CBS. Verificar junto ao fornecedor."
            : "Nota de saída em Regime Normal sem destaque de IBS/CBS. Verificar configuração do sistema.",
      });
    }
    return out;
  }

  static countByRegime(documents: FiscalDocument[]) {
    let rpa = 0, simples = 0, mei = 0;
    for (const d of documents) {
      if (d.tax_regime === "RPA") rpa++;
      else if (d.tax_regime === "SIMPLES_NACIONAL") simples++;
      else if (d.tax_regime === "MEI") mei++;
    }
    return { rpa, simples, mei };
  }
}
