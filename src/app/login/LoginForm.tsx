"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { HaptusLogo } from "@/components/brand/HaptusLogo";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

export function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) {
      window.location.href = redirectTo;
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    window.location.href = redirectTo;
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <HaptusLogo />
        </div>
        <h1 style={{ fontSize: 19, textAlign: "center", marginBottom: 4 }}>Simples Apuração RTC</h1>
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13.5, marginTop: 0, marginBottom: 22 }}>
          Apuração de IBS/CBS · LC 214/2025
        </p>

        {!configured && (
          <div className="notice notice-info mb" style={{ fontSize: 12.5 }}>
            Modo demonstração ativo (Supabase não configurado). Clique em entrar para acessar.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {configured && (
            <>
              <label className="field-label">E-mail</label>
              <input className="input mb" type="email" value={email} required
                onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com.br" />
              <label className="field-label">Senha</label>
              <input className="input" type="password" value={password} required
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </>
          )}
          {error && <div className="notice notice-warn mt" style={{ fontSize: 13 }}>{error}</div>}
          <button className="btn btn-primary mt" style={{ width: "100%" }} disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> Entrando…</> : <><LogIn size={16} /> Entrar</>}
          </button>
        </form>
      </div>
    </div>
  );
}
