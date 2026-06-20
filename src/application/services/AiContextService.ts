// ─────────────────────────────────────────────────────────────
// GUARDIÃO DE PRIVACIDADE.
// Constrói o AiContext enviado ao Gemini — APENAS estatísticas
// agregadas. NUNCA inclui CNPJs, nomes de empresas ou chaves.
// Auditado por testes (auditContextPrivacy).
// ─────────────────────────────────────────────────────────────

import type { FiscalDocument } from "@/domain/models/FiscalDocument";
import type { AiContext } from "@/domain/models/AiTypes";
import { TaxAnalyzerService } from "./TaxAnalyzerService";
import { formatPeriodLabel } from "@/lib/utils";

const DOC_LABEL: Record<string, string> = {
  NFE: "NF-e",
  NFCE: "NFC-e",
  CTE: "CT-e",
  NFSE: "NFS-e",
  UNKNOWN: "Outros",
};

function isCnpj(value: string): boolean {
  return value.replace(/\D/g, "").length === 14;
}

export class AiContextService {
  static buildAiContext(documents: FiscalDocument[]): AiContext {
    const apuracao = TaxAnalyzerService.calculateApuracao(documents);
    const dates = documents
      .map((d) => new Date(d.issue_date))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    const period = dates.length
      ? `${formatPeriodLabel(dates[0].toISOString())} – ${formatPeriodLabel(
          dates[dates.length - 1].toISOString(),
        )}`
      : "—";

    const inbound = documents.filter((d) => d.direction === "INBOUND");
    const outbound = documents.filter((d) => d.direction === "OUTBOUND");

    // byDocType
    const typeMap = new Map<string, { count: number; credito: number; debito: number }>();
    for (const d of documents) {
      const e = typeMap.get(d.document_type) ?? { count: 0, credito: 0, debito: 0 };
      e.count++;
      for (const it of d.items) {
        const v = TaxAnalyzerService.rtcValue(it);
        if (it.rtc_impact === "CREDIT") e.credito += v;
        else if (it.rtc_impact === "DEBIT") e.debito += v;
      }
      typeMap.set(d.document_type, e);
    }
    const byDocType = Array.from(typeMap.entries()).map(([tipo, v]) => ({
      tipo: DOC_LABEL[tipo] ?? tipo,
      count: v.count,
      credito: Math.round(v.credito * 100) / 100,
      debito: Math.round(v.debito * 100) / 100,
    }));

    // companyRegime: regime predominante nos documentos de SAÍDA (emitidos por nós)
    const regimeCount = new Map<string, number>();
    for (const d of outbound) {
      regimeCount.set(d.tax_regime, (regimeCount.get(d.tax_regime) ?? 0) + 1);
    }
    let companyRegime: AiContext["companyRegime"] = "UNKNOWN";
    let maxR = 0;
    for (const [r, n] of regimeCount) {
      if (n > maxR && r !== "UNKNOWN") {
        maxR = n;
        companyRegime = r as AiContext["companyRegime"];
      }
    }

    // purchaseProfile (entradas)
    let withCredits = 0;
    let neutral = 0;
    for (const d of inbound) {
      const v = d.items.reduce((s, it) => s + TaxAnalyzerService.rtcValue(it), 0);
      if (v > 0) withCredits++;
      else neutral++;
    }
    const purchaseTotal = withCredits + neutral;

    // salesProfile (saídas)
    let b2b = 0;
    let b2c = 0;
    for (const d of outbound) {
      if (d.document_type === "NFCE") b2c++;
      else if (isCnpj(d.receiver.cnpj_cpf)) b2b++;
      else b2c++;
    }
    const salesTotal = b2b + b2c;

    const inconformes = TaxAnalyzerService.getInconformes(documents).length;
    const topCfops = TaxAnalyzerService.groupByCfop(documents)
      .slice(0, 8)
      .map((c) => ({ cfop: c.cfop, credito: c.credito, debito: c.debito }));
    const temporal = TaxAnalyzerService.groupByPeriod(documents, "MONTHLY").map((t) => ({
      label: t.label,
      credito: t.credito,
      debito: t.debito,
      saldo: t.saldo,
    }));

    return {
      period,
      totalDocs: documents.length,
      volumes: {
        inbound: inbound.length,
        outbound: outbound.length,
        total: documents.length,
      },
      ibscbs: {
        credito: apuracao.credito,
        debito: apuracao.debito,
        saldo: apuracao.saldo,
        creditRate: apuracao.creditRate,
        debitRate: apuracao.debitRate,
        balanceRate: apuracao.balanceRate,
      },
      byDocType,
      byRegime: TaxAnalyzerService.countByRegime(documents),
      inconformes,
      topCfops,
      temporal,
      companyRegime,
      purchaseProfile: {
        withCredits,
        neutral,
        creditCoverageRate: purchaseTotal
          ? Math.round((withCredits / purchaseTotal) * 1000) / 10
          : 0,
      },
      salesProfile: {
        b2b,
        b2c,
        b2bRate: salesTotal ? Math.round((b2b / salesTotal) * 1000) / 10 : 0,
      },
    };
  }

  /**
   * Auditoria de privacidade: garante que nenhum CNPJ, nome ou chave de
   * acesso dos documentos vazou para o contexto. Retorna lista de violações.
   */
  static auditContextPrivacy(
    context: AiContext,
    documents: FiscalDocument[],
  ): string[] {
    const blob = JSON.stringify(context);
    const violations: string[] = [];
    const seen = new Set<string>();

    const check = (value: string, kind: string) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length >= 11 && blob.includes(digits) && !seen.has(digits)) {
        seen.add(digits);
        violations.push(`${kind} vazou: ${digits}`);
      }
      if (value && value.length > 4) {
        const upper = value.toUpperCase();
        if (
          blob.toUpperCase().includes(upper) &&
          !["—", "CONSUMIDOR FINAL"].includes(upper) &&
          !seen.has(upper)
        ) {
          seen.add(upper);
          violations.push(`${kind} (nome) vazou: ${value}`);
        }
      }
    };

    for (const d of documents) {
      check(d.issuer.cnpj_cpf, "CNPJ emitente");
      check(d.receiver.cnpj_cpf, "CNPJ destinatário");
      if (d.access_key) {
        const k = d.access_key.replace(/\D/g, "");
        if (k.length === 44 && blob.includes(k)) {
          violations.push(`Chave de acesso vazou: ${k}`);
        }
      }
      if (d.issuer.name) check(d.issuer.name, "Emitente");
      if (d.receiver.name && d.receiver.name !== "CONSUMIDOR FINAL")
        check(d.receiver.name, "Destinatário");
    }
    return violations;
  }
}
