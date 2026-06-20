import { describe, it, expect } from "vitest";
import { ParserFactory } from "@/infrastructure/parsers/ParserFactory";
import { TaxAnalyzerService } from "@/application/services/TaxAnalyzerService";
import { loadFixture } from "./helpers";

function batch() {
  return [
    "nfe_rpa_com_ibs.xml",
    "nfe_simples_sem_ibs.xml",
    "cte_rpa_com_ibs.xml",
    "nfse_nacional_com_ibs.xml",
    "nfe_rpa_inconforme.xml",
  ].map((f) => ParserFactory.parse(loadFixture(f), f));
}

describe("TaxAnalyzerService", () => {
  it("determina o declarante como a raiz de CNPJ mais frequente", () => {
    const docs = batch();
    expect(TaxAnalyzerService.determineOwnerRoot(docs)).toBe("98765432");
  });

  it("classifica direção e impacto (declarante = destinatário → CRÉDITO)", () => {
    const docs = TaxAnalyzerService.enrich(batch());
    const nfe = docs.find((d) => d.access_key.includes("550010000000011"))!;
    expect(nfe.direction).toBe("INBOUND");
    expect(nfe.items[0].rtc_impact).toBe("CREDIT");
  });

  it("calcula a apuração (posição credora)", () => {
    const docs = TaxAnalyzerService.enrich(batch());
    const a = TaxAnalyzerService.calculateApuracao(docs);
    // créditos: NF-e 285 + CT-e 57 + NFS-e 380 = 722
    expect(a.credito).toBeCloseTo(722, 2);
    expect(a.debito).toBe(0);
    expect(a.saldo).toBeCloseTo(722, 2);
    expect(a.position).toBe("CREDORA");
  });

  it("ignora fornecedor Simples (não é inconformidade) mas sinaliza RPA sem destaque", () => {
    const docs = TaxAnalyzerService.enrich(batch());
    const inconformes = TaxAnalyzerService.getInconformes(docs);
    expect(inconformes).toHaveLength(1);
    expect(inconformes[0].doc.issuer.cnpj_cpf).toBe("77777777000177");
  });

  it("exclui exportação (CFOP 7.xxx) da apuração", () => {
    expect(TaxAnalyzerService.impactFor(
      { rtc: { vIBS: 10, vCBS: 5 }, cfop: "7101" } as never,
      "OUTBOUND",
    )).toBe("NEUTRAL");
  });

  it("agrupa por período mensal com acumulado", () => {
    const docs = TaxAnalyzerService.enrich(batch());
    const periods = TaxAnalyzerService.groupByPeriod(docs, "MONTHLY");
    expect(periods.length).toBeGreaterThan(0);
    const last = periods[periods.length - 1];
    expect(last).toHaveProperty("acumulado");
  });

  it("não avalia conformidade antes de 2026", () => {
    const docs = TaxAnalyzerService.enrich(batch());
    const old = { ...docs[4], issue_date: "2025-12-01T00:00:00" };
    expect(TaxAnalyzerService.getInconformes([old])).toHaveLength(0);
  });
});
