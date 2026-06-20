import type { DocumentType } from "@/domain/models/FiscalDocument";

/**
 * Detecção do tipo de documento a partir do XML bruto (regex — barato e
 * resiliente a namespaces). Ver SPEC_XML_MAPPING_v2 para os critérios.
 */
export class DocumentDetector {
  static detect(xml: string): DocumentType {
    if (!xml || typeof xml !== "string") return "UNKNOWN";

    // ABRASF municipal antigo → NÃO suportado (checar ANTES do padrão nacional)
    if (/<CompNfse/i.test(xml)) return "UNKNOWN";

    // NFS-e Nacional (SNNFSe) — namespace gov.br/nfse ou estrutura DPS
    if (/sped\.fazenda\.gov\.br\/nfse/i.test(xml) || /<DPS\b/i.test(xml)) {
      return "NFSE";
    }

    // CT-e
    if (/<cteProc/i.test(xml) || /<CTe[ >]/i.test(xml) || /<infCte/i.test(xml)) {
      return "CTE";
    }

    // NF-e / NFC-e — diferenciados pelo modelo
    if (/<nfeProc/i.test(xml) || /<NFe[ >]/i.test(xml) || /<infNFe/i.test(xml)) {
      const mod = xml.match(/<mod>\s*(\d{2})\s*<\/mod>/i);
      if (mod && mod[1] === "65") return "NFCE";
      return "NFE";
    }

    return "UNKNOWN";
  }
}
