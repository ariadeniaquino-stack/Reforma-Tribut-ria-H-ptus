import type { IXmlParser } from "./IXmlParser";
import type { DocumentType, FiscalDocument } from "@/domain/models/FiscalDocument";
import { DocumentDetector } from "./DocumentDetector";
import { ParserNFe } from "./ParserNFe";
import { ParserCTe } from "./ParserCTe";
import { ParserNFSe } from "./ParserNFSe";

export class ParserFactory {
  private static parsers: Partial<Record<DocumentType, IXmlParser>> = {
    NFE: new ParserNFe(),
    NFCE: new ParserNFe(), // NFC-e reaproveita o ParserNFe (diferenciado por mod 65)
    CTE: new ParserCTe(),
    NFSE: new ParserNFSe(),
  };

  static getParser(type: DocumentType): IXmlParser | null {
    return this.parsers[type] ?? null;
  }

  /**
   * Detecta o tipo e faz o parse. Lança erro descritivo para tipos não
   * suportados (ex.: NFS-e ABRASF municipal).
   */
  static parse(xml: string, filename: string): FiscalDocument {
    const type = DocumentDetector.detect(xml);
    const parser = this.getParser(type);
    if (!parser) {
      throw new Error(
        `Tipo de documento não suportado (${type}) em "${filename}". ` +
          `NFS-e deve estar no padrão nacional SNNFSe (não ABRASF municipal).`,
      );
    }
    return parser.parse(xml, filename);
  }
}
