import { describe, it, expect } from "vitest";
import { ParserFactory } from "@/infrastructure/parsers/ParserFactory";
import { TaxAnalyzerService } from "@/application/services/TaxAnalyzerService";
import { AiContextService } from "@/application/services/AiContextService";
import { loadFixture } from "./helpers";

function enriched() {
  const docs = [
    "nfe_rpa_com_ibs.xml",
    "nfe_simples_sem_ibs.xml",
    "cte_rpa_com_ibs.xml",
    "nfse_nacional_com_ibs.xml",
    "nfce_consumidor.xml",
  ].map((f) => ParserFactory.parse(loadFixture(f), f));
  return TaxAnalyzerService.enrich(docs);
}

describe("AiContextService — guardião de privacidade", () => {
  it("constrói contexto com agregados", () => {
    const ctx = AiContextService.buildAiContext(enriched());
    expect(ctx.totalDocs).toBe(5);
    expect(ctx.ibscbs.credito).toBeGreaterThan(0);
    expect(ctx.byDocType.length).toBeGreaterThan(0);
    expect(ctx.byRegime.rpa).toBeGreaterThan(0);
  });

  it("NUNCA vaza CNPJs, nomes ou chaves de acesso", () => {
    const docs = enriched();
    const ctx = AiContextService.buildAiContext(docs);
    const violations = AiContextService.auditContextPrivacy(ctx, docs);
    expect(violations).toEqual([]);
  });

  it("detecta vazamento se um CNPJ for injetado (sanidade do auditor)", () => {
    const docs = enriched();
    const ctx = AiContextService.buildAiContext(docs);
    // Injeta artificialmente um CNPJ no contexto
    (ctx as unknown as { period: string }).period = docs[0].issuer.cnpj_cpf;
    const violations = AiContextService.auditContextPrivacy(ctx, docs);
    expect(violations.length).toBeGreaterThan(0);
  });

  it("calcula perfil de compras e vendas", () => {
    const ctx = AiContextService.buildAiContext(enriched());
    expect(ctx.purchaseProfile.withCredits + ctx.purchaseProfile.neutral).toBeGreaterThan(0);
    expect(ctx.salesProfile.b2b + ctx.salesProfile.b2c).toBeGreaterThanOrEqual(0);
  });
});
