// Ingestão de arquivos: aceita .xml e .zip (com XMLs dentro).
// Detecta, faz o parse e retorna documentos + erros. 100% client-side.

import JSZip from "jszip";
import type { FiscalDocument } from "@/domain/models/FiscalDocument";
import { ParserFactory } from "@/infrastructure/parsers/ParserFactory";

export interface IngestResult {
  documents: FiscalDocument[];
  errors: Array<{ filename: string; message: string }>;
}

async function readXmlFiles(files: File[]): Promise<Array<{ name: string; content: string }>> {
  const out: Array<{ name: string; content: string }> = [];
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter(
        (e) => !e.dir && e.name.toLowerCase().endsWith(".xml"),
      );
      for (const entry of entries) {
        const content = await entry.async("string");
        out.push({ name: entry.name, content });
      }
    } else if (lower.endsWith(".xml")) {
      const content = await file.text();
      out.push({ name: file.name, content });
    }
  }
  return out;
}

export class IngestService {
  static async ingest(files: File[]): Promise<IngestResult> {
    const raw = await readXmlFiles(files);
    const documents: FiscalDocument[] = [];
    const errors: IngestResult["errors"] = [];
    for (const { name, content } of raw) {
      try {
        documents.push(ParserFactory.parse(content, name));
      } catch (e) {
        errors.push({
          filename: name,
          message: e instanceof Error ? e.message : "Erro desconhecido",
        });
      }
    }
    return { documents, errors };
  }
}
