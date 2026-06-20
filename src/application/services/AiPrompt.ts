// Construção do prompt do Dossiê Tributário (texto legível, não JSON — ADR-05).
// Adaptativo por regime: RPA / Simples+B2C / Simples+B2B.

import type { AiContext } from "@/domain/models/AiTypes";
import { formatBRL, formatPercent } from "@/lib/utils";

function regimeSection(ctx: AiContext): string {
  const isSimples =
    ctx.companyRegime === "SIMPLES_NACIONAL" || ctx.companyRegime === "MEI";
  if (!isSimples) {
    return `A empresa analisada opera em REGIME NORMAL (RPA). Avalie a apuração de IBS/CBS pela não-cumulatividade plena: todo crédito de entrada compensa débito de saída. Comente o aproveitamento de créditos (cobertura de ${formatPercent(
      ctx.purchaseProfile.creditCoverageRate,
    )} das entradas com crédito) e a posição ${ctx.ibscbs.saldo >= 0 ? "credora" : "devedora"}.`;
  }
  if (ctx.salesProfile.b2bRate >= 50) {
    return `A empresa é do SIMPLES NACIONAL com perfil de vendas predominantemente B2B (${formatPercent(
      ctx.salesProfile.b2bRate,
    )} para CNPJs). ALERTA DE RISCO COMPETITIVO: clientes empresas (RPA) que compram desta empresa NÃO se creditam de IBS/CBS, pois o Simples não destaca o imposto. Analise o risco de perda de competitividade e a possível vantagem de migração para o Regime Normal.`;
  }
  return `A empresa é do SIMPLES NACIONAL com perfil de vendas predominantemente B2C (consumidor final). O recolhimento via DAS tende a ser vantajoso. Avalie se há entradas com IBS/CBS que estão sendo perdidas como custo.`;
}

export function buildReportPrompt(ctx: AiContext, companyName?: string): string {
  const docTypes = ctx.byDocType
    .map((d) => `  - ${d.tipo}: ${d.count} docs | crédito ${formatBRL(d.credito)} | débito ${formatBRL(d.debito)}`)
    .join("\n");
  const cfops = ctx.topCfops
    .map((c) => `  - CFOP ${c.cfop}: crédito ${formatBRL(c.credito)} | débito ${formatBRL(c.debito)}`)
    .join("\n");
  const temporal = ctx.temporal
    .map((t) => `  - ${t.label}: saldo ${formatBRL(t.saldo)}`)
    .join("\n");

  return `Você é um consultor tributário especialista na Reforma Tributária do Consumo brasileira (LC 214/2025, IBS/CBS). Produza um DOSSIÊ TRIBUTÁRIO profissional em português, em Markdown, com tabelas (use GitHub Flavored Markdown).

${companyName ? `Empresa: ${companyName}\n` : ""}Período analisado: ${ctx.period}
Total de documentos: ${ctx.totalDocs} (${ctx.volumes.inbound} entradas, ${ctx.volumes.outbound} saídas)

APURAÇÃO IBS/CBS:
  - Créditos: ${formatBRL(ctx.ibscbs.credito)}
  - Débitos: ${formatBRL(ctx.ibscbs.debito)}
  - Saldo: ${formatBRL(ctx.ibscbs.saldo)} (${ctx.ibscbs.saldo >= 0 ? "posição CREDORA" : "posição DEVEDORA"})
  - Carga s/ compras: ${formatPercent(ctx.ibscbs.creditRate)}
  - Carga s/ vendas: ${formatPercent(ctx.ibscbs.debitRate)}
  - Efeito líquido s/ vendas: ${formatPercent(ctx.ibscbs.balanceRate)}

POR TIPO DE DOCUMENTO:
${docTypes || "  (sem dados)"}

REGIMES (nº de documentos): RPA ${ctx.byRegime.rpa} | Simples ${ctx.byRegime.simples} | MEI ${ctx.byRegime.mei}
Inconformidades detectadas: ${ctx.inconformes}

PRINCIPAIS CFOPs:
${cfops || "  (sem dados)"}

EVOLUÇÃO TEMPORAL (saldo por mês):
${temporal || "  (sem dados)"}

CONTEXTO DO REGIME:
${regimeSection(ctx)}

Estruture o dossiê com as seções: (1) Sumário Executivo, (2) Apuração do Período, (3) Análise de Créditos e Débitos, (4) Conformidade e Riscos, (5) Recomendações Práticas. Seja preciso, cite os números fornecidos, e deixe claro que as alíquotas são de transição (2026-2032) e a regulamentação ainda está em construção. NÃO invente CNPJs ou nomes de empresas — você não os recebeu por design de privacidade.`;
}
