import type { FiscalDocument } from "@/domain/models/FiscalDocument";

export interface IXmlParser {
  /** Faz o parse de um XML em FiscalDocument. */
  parse(xml: string, filename: string): FiscalDocument;
}
