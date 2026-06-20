"use client";

import { useState } from "react";
import { FolderSearch, Download, Trash2, FileSpreadsheet } from "lucide-react";
import { useFiscalStore } from "@/application/store/useFiscalStore";
import { ExportService } from "@/application/services/ExportService";
import { formatBRL } from "@/lib/utils";
import type { FiscalDocument } from "@/domain/models/FiscalDocument";

const DOC_LABEL: Record<string, string> = {
  NFE: "NF-e", NFCE: "NFC-e", CTE: "CT-e", NFSE: "NFS-e", UNKNOWN: "Outros",
};
const DIR_LABEL: Record<string, string> = {
  INBOUND: "Entrada", OUTBOUND: "Saída", UNKNOWN: "—",
};

function docRtc(d: FiscalDocument) {
  return d.items.reduce((s, it) => s + (it.rtc.vIBS ?? 0) + (it.rtc.vCBS ?? 0), 0);
}

export default function ExplorerPage() {
  const { documents, removeDocument } = useFiscalStore();
  const [filter, setFilter] = useState<string>("ALL");

  const filtered =
    filter === "ALL" ? documents : documents.filter((d) => d.document_type === filter);

  if (documents.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <div className="empty-icon"><FolderSearch size={26} /></div>
          <h3>Nenhum documento carregado</h3>
          <p>Importe XMLs na tela de Upload para explorá-los aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row between wrap mb">
        <div className="row wrap" style={{ gap: 8 }}>
          {["ALL", "NFE", "NFCE", "CTE", "NFSE"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${filter === t ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilter(t)}
            >
              {t === "ALL" ? "Todos" : DOC_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => ExportService.exportCsv(documents)}>
            <Download size={15} /> CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => ExportService.exportExcel(documents)}>
            <FileSpreadsheet size={15} /> Excel
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Emissão</th>
              <th>Direção</th>
              <th>Regime</th>
              <th>Emitente</th>
              <th>Destinatário</th>
              <th className="num">Valor</th>
              <th className="num">IBS+CBS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.access_key}>
                <td><span className="badge badge-brand">{DOC_LABEL[d.document_type]}</span></td>
                <td className="mono">{d.issue_date?.slice(0, 10) || "—"}</td>
                <td>{DIR_LABEL[d.direction]}</td>
                <td>{d.tax_regime}</td>
                <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.issuer.name || "—"}</td>
                <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.receiver.name || "—"}</td>
                <td className="num">{formatBRL(d.total_value)}</td>
                <td className="num">{formatBRL(docRtc(d))}</td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    title="Remover"
                    onClick={() => removeDocument(d.access_key)}
                    style={{ padding: 6 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
