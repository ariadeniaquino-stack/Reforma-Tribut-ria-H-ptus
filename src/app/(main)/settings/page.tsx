"use client";

import { useEffect, useState } from "react";
import { Settings as Cog, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import { useAiStore } from "@/application/store/useAiStore";
import type { GeminiModel } from "@/domain/models/AiTypes";

const MODELS: { value: GeminiModel; label: string }[] = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (rápido, padrão)" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (mais detalhado)" },
];

export default function SettingsPage() {
  const { settings, setModel, setCompanyName, setCompanyLogo } = useAiStore();
  const [keyConfigured, setKeyConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/ai/status").then((r) => r.json()).then((d) => setKeyConfigured(Boolean(d.configured))).catch(() => setKeyConfigured(false));
  }, []);

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCompanyLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div className="card card-pad">
        <div className="card-title"><Cog size={16} /> Identidade nos relatórios</div>

        <label className="field-label">Nome da empresa (“Preparado por”)</label>
        <input
          className="input"
          value={settings.companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="HAPTUS Assessoria Contábil"
        />

        <label className="field-label" style={{ marginTop: 16 }}>Logotipo (PNG/JPG)</label>
        <div className="row" style={{ gap: 14 }}>
          <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
            <ImageIcon size={15} /> Enviar logo
            <input type="file" accept="image/*" hidden onChange={onLogo} />
          </label>
          {settings.companyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.companyLogo} alt="logo" style={{ height: 38, borderRadius: 6 }} />
          ) : (
            <span style={{ color: "var(--muted)", fontSize: 13 }}>Nenhum logo definido</span>
          )}
          {settings.companyLogo && (
            <button className="btn btn-ghost btn-sm" onClick={() => setCompanyLogo(null)}>Remover</button>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-title"><Cog size={16} /> Inteligência Artificial</div>

        <label className="field-label">Modelo Gemini</label>
        <select className="input" value={settings.model} onChange={(e) => setModel(e.target.value as GeminiModel)}>
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <label className="field-label" style={{ marginTop: 16 }}>Status da chave (servidor)</label>
        {keyConfigured === null ? (
          <span className="badge badge-muted">Verificando…</span>
        ) : keyConfigured ? (
          <span className="badge badge-ok"><CheckCircle2 size={13} /> GEMINI_API_KEY configurada</span>
        ) : (
          <span className="badge badge-danger"><XCircle size={13} /> GEMINI_API_KEY ausente</span>
        )}

        <div className="notice notice-info mt" style={{ fontSize: 12.5 }}>
          A chave do Gemini fica somente no servidor (variável de ambiente). Crie uma
          gratuitamente em aistudio.google.com.
        </div>
      </div>
    </div>
  );
}
