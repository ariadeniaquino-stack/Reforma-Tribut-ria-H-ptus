"use client";

import Link from "next/link";
import { Database, Trash2, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { UploadZone } from "@/components/upload/UploadZone";
import { useFiscalStore } from "@/application/store/useFiscalStore";
import { getSampleFiles } from "@/lib/samples";
import { formatBRL } from "@/lib/utils";
import { TaxAnalyzerService } from "@/application/services/TaxAnalyzerService";

const DOC_LABEL: Record<string, string> = {
  NFE: "NF-e", NFCE: "NFC-e", CTE: "CT-e", NFSE: "NFS-e", UNKNOWN: "Outros",
};

export default function UploadPage() {
  const { documents, errors, addFiles, clear } = useFiscalStore();
  const apuracao = TaxAnalyzerService.calculateApuracao(documents);

  const byType = documents.reduce<Record<string, number>>((acc, d) => {
    acc[d.document_type] = (acc[d.document_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="notice notice-info mb">
        <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>Privacidade por design.</strong> Os XMLs são lidos e processados
          inteiramente no seu navegador. Nenhum documento, CNPJ ou chave de acesso
          é enviado a servidores.
        </span>
      </div>

      <UploadZone />

      <div className="row wrap mt" style={{ gap: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => addFiles(getSampleFiles())}>
          <Database size={15} /> Carregar dados de exemplo
        </button>
        {documents.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clear}>
            <Trash2 size={15} /> Limpar tudo
          </button>
        )}
      </div>

      {documents.length > 0 && (
        <>
          <div className="grid grid-kpi mt">
            <div className="kpi">
              <div className="kpi-label">Documentos</div>
              <div className="kpi-value">{documents.length}</div>
              <div className="kpi-sub">
                {Object.entries(byType)
                  .map(([t, n]) => `${n} ${DOC_LABEL[t] ?? t}`)
                  .join(" · ")}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Créditos IBS/CBS</div>
              <div className="kpi-value kpi-accent-credit">{formatBRL(apuracao.credito)}</div>
              <div className="kpi-sub">entradas com destaque</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Débitos IBS/CBS</div>
              <div className="kpi-value kpi-accent-debit">{formatBRL(apuracao.debito)}</div>
              <div className="kpi-sub">saídas tributadas</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Saldo do período</div>
              <div className="kpi-value kpi-accent-brand">{formatBRL(apuracao.saldo)}</div>
              <div className="kpi-sub">posição {apuracao.position.toLowerCase()}</div>
            </div>
          </div>

          <div className="row mt">
            <Link href="/analysis" className="btn btn-primary">
              Ver apuração completa <ArrowRight size={16} />
            </Link>
          </div>
        </>
      )}

      {errors.length > 0 && (
        <div className="card card-pad mt" style={{ borderColor: "var(--warn)" }}>
          <div className="card-title" style={{ color: "var(--warn)" }}>
            <AlertTriangle size={16} /> {errors.length} arquivo(s) não processado(s)
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-soft)", fontSize: 13.5 }}>
            {errors.slice(0, 8).map((e, i) => (
              <li key={i}>
                <strong>{e.filename}:</strong> {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
