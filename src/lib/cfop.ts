// ─────────────────────────────────────────────────────────────
// Lógica de CFOP — papel SECUNDÁRIO na apuração.
// O CFOP NÃO determina crédito/débito (isso é dado pela direção).
// O CFOP serve apenas para EXCLUIR operações não-comerciais da
// análise de conformidade. (Ver SPEC_XML_MAPPING_v2 §"papel real")
// ─────────────────────────────────────────────────────────────

/** Normaliza CFOP para 4 dígitos (remove ponto). */
export function normalizeCfop(cfop: string | undefined): string {
  if (!cfop) return "";
  return cfop.replace(/\D/g, "").slice(0, 4);
}

/**
 * Operações que, por natureza, NÃO geram obrigação de destacar IBS/CBS.
 * Prefixos: remessas, brindes, amostras, industrialização, exportação.
 */
export function isExcludedCfop(cfop: string | undefined): boolean {
  const c = normalizeCfop(cfop);
  if (c.length < 4) return false;

  const family = c[0]; // 1,2,5,6,7
  const middle = c[1]; // segundo dígito

  // Exportação (7.xxx) — imune
  if (family === "7") return true;

  // 5.9xx / 6.9xx / 1.9xx / 2.9xx → outras saídas/entradas não comerciais
  if (middle === "9") return true;

  return false;
}

/** Rótulo informativo da categoria do CFOP (metadado, não afeta apuração). */
export function cfopCategory(cfop: string | undefined): string {
  const c = normalizeCfop(cfop);
  if (c.length < 4) return "—";
  const family = c[0];
  const mid = c[1];
  if (family === "7") return "Exportação";
  if (mid === "9") return "Remessa/Outros";
  if (mid === "2") return "Devolução";
  if (mid === "5") return "Ativo Imobilizado";
  if (mid === "1" || mid === "4") return "Compra/Venda";
  return "Outros";
}
