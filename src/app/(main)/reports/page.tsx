"use client";

import { ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useFiscalStore } from "@/application/store/useFiscalStore";
import { TaxAnalyzerService } from "@/application/services/TaxAnalyzerService";
import { formatBRL } from "@/lib/utils";

const DOC_LABEL: Record<string, string> = {
  NFE: "NF-e", NFCE: "NFC-e", CTE: "CT-e", NFSE: "NFS-e", UNKNOWN: "Outros",
};

export default function ReportsPage() {
  const documents = useFiscalStore((s) => s.documents);

  if (documents.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <div className="empty-icon"><ShieldCheck size={26} /></div>
          <h3>Conformidade indisponível</h3>
          <p>Carregue documentos para verificar o destaque de IBS/CBS.</p>
        </div>
      </div>
    );
  }

  const inconformes = TaxAnalyzerService.getInconformes(documents);
  const rate = ((documents.length - inconformes.length) / documents.length) * 100;

  return (
    <div>
      <div className="grid grid-kpi mb">
        <div className="kpi">
          <div className="kpi-label">Taxa de conformidade</div>
          <div className="kpi-value kpi-accent-brand">{rate.toFixed(0)}%</div>
          <div className="kpi-sub">{documents.length} documento(s) avaliado(s)</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Inconformidades</div>
          <div className="kpi-value" style={{ color: inconformes.length ? "var(--danger)" : "var(--ok)" }}>
            {inconformes.length}
          </div>
          <div className="kpi-sub">RPA sem destaque de IBS/CBS</div>
        </div>
      </div>

      {inconformes.length === 0 ? (
        <div className="card card-pad">
          <div className="row" style={{ gap: 12, color: "var(--ok)" }}>
            <CheckCircle2 size={22} />
            <div>
              <strong>Nenhuma inconformidade detectada.</strong>
              <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>
                Todos os documentos de Regime Normal pós-2026 destacaram IBS/CBS adequadamente.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Tipo</th><th>Emissão</th><th>Emitente</th>
                <th className="num">Valor</th><th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {inconformes.map(({ doc, reason }) => (
                <tr key={doc.access_key}>
                  <td><span className="badge badge-danger">{DOC_LABEL[doc.document_type]}</span></td>
                  <td className="mono">{doc.issue_date?.slice(0, 10)}</td>
                  <td>{doc.issuer.name}</td>
                  <td className="num">{formatBRL(doc.total_value)}</td>
                  <td style={{ fontSize: 13 }}>
                    <AlertTriangle size={13} style={{ color: "var(--warn)", verticalAlign: "-2px", marginRight: 5 }} />
                    {reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="notice notice-info mt">
        <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Premissas: documentos anteriores a <strong>01/01/2026</strong> não são avaliados;
          fornecedores do <strong>Simples Nacional</strong> não geram inconformidade (não destacam
          IBS/CBS por regra do regime); operações não-comerciais (remessas, brindes, exportação)
          são excluídas da análise.
        </span>
      </div>
    </div>
  );
}
