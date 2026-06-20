"use client";

import { usePathname } from "next/navigation";
import { LogOut, FileStack } from "lucide-react";
import { useFiscalStore } from "@/application/store/useFiscalStore";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

const TITLES: Record<string, { t: string; s: string }> = {
  "/": { t: "Upload de Documentos", s: "Importe XMLs ou ZIPs de NF-e, NFC-e, CT-e e NFS-e" },
  "/explorer": { t: "Explorador", s: "Documentos fiscais processados" },
  "/analysis": { t: "Apuração RTC", s: "Créditos e débitos de IBS/CBS" },
  "/temporal": { t: "Análise Temporal", s: "Evolução da apuração por período" },
  "/reports": { t: "Conformidade", s: "Inconformidades de destaque de IBS/CBS" },
  "/ai": { t: "Dossiê Tributário", s: "Análise inteligente do período" },
  "/settings": { t: "Configurações", s: "Modelo de IA, identidade e preferências" },
};

export function Header() {
  const pathname = usePathname();
  const docs = useFiscalStore((s) => s.documents);
  const info = TITLES[pathname] ?? { t: "Simples Apuração RTC", s: "" };

  async function handleLogout() {
    if (isSupabaseConfigured()) {
      await getSupabaseBrowser()?.auth.signOut();
    }
    window.location.href = "/login";
  }

  return (
    <header className="topbar">
      <div>
        <h2>{info.t}</h2>
        {info.s && <div className="sub">{info.s}</div>}
      </div>
      <div className="row" style={{ gap: 16 }}>
        <span className="badge badge-brand">
          <FileStack size={13} /> {docs.length} doc{docs.length === 1 ? "" : "s"}
        </span>
        {isSupabaseConfigured() && (
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            <LogOut size={15} /> Sair
          </button>
        )}
      </div>
    </header>
  );
}
