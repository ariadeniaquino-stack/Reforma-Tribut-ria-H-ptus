"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, ShieldCheck, Printer, AlertCircle } from "lucide-react";
import { useFiscalStore } from "@/application/store/useFiscalStore";
import { useAiStore } from "@/application/store/useAiStore";
import { AiContextService } from "@/application/services/AiContextService";
import { formatBRL } from "@/lib/utils";

export default function AiPage() {
  const documents = useFiscalStore((s) => s.documents);
  const settings = useAiStore((s) => s.settings);
  const addReport = useAiStore((s) => s.addReport);

  const [keyConfigured, setKeyConfigured] = useState<boolean | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const context = useMemo(
    () => (documents.length ? AiContextService.buildAiContext(documents) : null),
    [documents],
  );

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setKeyConfigured(Boolean(d.configured)))
      .catch(() => setKeyConfigured(false));
  }, []);

  async function generate() {
    if (!context) return;
    setStreaming(true);
    setText("");
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          context,
          model: settings.model,
          maxTokens: settings.maxOutputTokens,
          companyName: settings.companyName,
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao gerar o dossiê.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
      addReport({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        regime: context.companyRegime,
        markdown: acc,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setStreaming(false);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <div className="empty-icon"><Sparkles size={26} /></div>
          <h3>Dossiê indisponível</h3>
          <p>Carregue documentos para gerar uma análise inteligente do período.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div>
        <div className="card card-pad">
          <div className="card-title"><ShieldCheck size={16} /> Dados enviados à IA</div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0 }}>
            Apenas estatísticas agregadas. <strong>Nenhum CNPJ, nome ou chave</strong> é transmitido.
          </p>
          {context && (
            <table className="data" style={{ fontSize: 13 }}>
              <tbody>
                <tr><td>Período</td><td className="num">{context.period}</td></tr>
                <tr><td>Documentos</td><td className="num">{context.totalDocs}</td></tr>
                <tr><td>Créditos</td><td className="num">{formatBRL(context.ibscbs.credito)}</td></tr>
                <tr><td>Débitos</td><td className="num">{formatBRL(context.ibscbs.debito)}</td></tr>
                <tr><td>Saldo</td><td className="num">{formatBRL(context.ibscbs.saldo)}</td></tr>
                <tr><td>Regime</td><td className="num">{context.companyRegime}</td></tr>
                <tr><td>Inconformidades</td><td className="num">{context.inconformes}</td></tr>
              </tbody>
            </table>
          )}
          <button
            className="btn btn-primary mt"
            style={{ width: "100%" }}
            onClick={generate}
            disabled={streaming || keyConfigured === false}
          >
            {streaming ? <><Loader2 size={16} className="spin" /> Gerando…</> : <><Sparkles size={16} /> Gerar Dossiê</>}
          </button>
          {keyConfigured === false && (
            <div className="notice notice-warn mt" style={{ fontSize: 12.5 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>GEMINI_API_KEY não configurada. Defina a chave nas variáveis de ambiente para habilitar o dossiê.</span>
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="row between mb">
          <div className="card-title" style={{ margin: 0 }}><Sparkles size={16} /> Dossiê Tributário</div>
          {text && !streaming && (
            <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
              <Printer size={14} /> Imprimir / PDF
            </button>
          )}
        </div>
        {error && (
          <div className="notice notice-warn" style={{ fontSize: 13 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}
        {!text && !error && (
          <p style={{ color: "var(--muted)" }}>
            Clique em <strong>Gerar Dossiê</strong> para produzir a análise do período.
          </p>
        )}
        {text && (
          <div className="md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
