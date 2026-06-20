// Exportação Excel (.xlsx) e CSV. Uso EXCLUSIVO de escrita (XLSX.writeFile),
// nunca leitura — evita o vetor de prototype pollution do SheetJS.

import * as XLSX from "xlsx";
import type { FiscalDocument } from "@/domain/models/FiscalDocument";
import { TaxAnalyzerService } from "./TaxAnalyzerService";

const DOC_LABEL: Record<string, string> = {
  NFE: "NF-e", NFCE: "NFC-e", CTE: "CT-e", NFSE: "NFS-e", UNKNOWN: "Outros",
};

export class ExportService {
  static buildDocumentsRows(documents: FiscalDocument[]) {
    return documents.map((d) => {
      const vIBS = d.items.reduce((s, it) => s + (it.rtc.vIBS ?? 0), 0);
      const vCBS = d.items.reduce((s, it) => s + (it.rtc.vCBS ?? 0), 0);
      return {
        Tipo: DOC_LABEL[d.document_type] ?? d.document_type,
        Chave: d.access_key,
        Emissão: d.issue_date?.slice(0, 10) ?? "",
        Direção: d.direction,
        Regime: d.tax_regime,
        Emitente: d.issuer.name,
        Destinatário: d.receiver.name,
        "Valor Total": d.total_value,
        "IBS (R$)": Math.round(vIBS * 100) / 100,
        "CBS (R$)": Math.round(vCBS * 100) / 100,
        "Itens": d.items.length,
      };
    });
  }

  static buildApuracaoRows(documents: FiscalDocument[]) {
    const a = TaxAnalyzerService.calculateApuracao(documents);
    return [
      { Indicador: "Créditos (entradas)", Valor: a.credito },
      { Indicador: "Débitos (saídas)", Valor: a.debito },
      { Indicador: "Saldo do período", Valor: a.saldo },
      { Indicador: "Posição", Valor: a.position },
      { Indicador: "Total Compras", Valor: a.totalCompras },
      { Indicador: "Total Vendas", Valor: a.totalVendas },
      { Indicador: "% Carga s/ Compras", Valor: a.creditRate },
      { Indicador: "% Carga s/ Vendas", Valor: a.debitRate },
      { Indicador: "% Efeito Líquido s/ Vendas", Valor: a.balanceRate },
    ];
  }

  /** Gera e dispara o download do arquivo .xlsx (somente no browser). */
  static exportExcel(documents: FiscalDocument[], filename = "apuracao-rtc.xlsx") {
    const wb = XLSX.utils.book_new();
    const wsDocs = XLSX.utils.json_to_sheet(this.buildDocumentsRows(documents));
    const wsApur = XLSX.utils.json_to_sheet(this.buildApuracaoRows(documents));
    XLSX.utils.book_append_sheet(wb, wsApur, "Apuração");
    XLSX.utils.book_append_sheet(wb, wsDocs, "Documentos");
    XLSX.writeFile(wb, filename);
  }

  static exportCsv(documents: FiscalDocument[], filename = "documentos-rtc.csv") {
    const ws = XLSX.utils.json_to_sheet(this.buildDocumentsRows(documents));
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
