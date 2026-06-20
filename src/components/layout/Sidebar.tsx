"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Upload,
  FolderSearch,
  Calculator,
  LineChart,
  ShieldCheck,
  Sparkles,
  Settings,
} from "lucide-react";
import { HaptusLogo } from "@/components/brand/HaptusLogo";

const NAV = [
  { href: "/", label: "Upload de XMLs", icon: Upload, section: "Documentos" },
  { href: "/explorer", label: "Explorador", icon: FolderSearch, section: "Documentos" },
  { href: "/analysis", label: "Apuração RTC", icon: Calculator, section: "Análise" },
  { href: "/temporal", label: "Análise Temporal", icon: LineChart, section: "Análise" },
  { href: "/reports", label: "Conformidade", icon: ShieldCheck, section: "Análise" },
  { href: "/ai", label: "Dossiê Tributário", icon: Sparkles, section: "Inteligência" },
  { href: "/settings", label: "Configurações", icon: Settings, section: "Sistema" },
];

export function Sidebar() {
  const pathname = usePathname();
  let lastSection = "";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <HaptusLogo />
      </div>
      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const showSection = item.section !== lastSection;
          lastSection = item.section;
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <div key={item.href}>
              {showSection && <div className="nav-section-label">{item.section}</div>}
              <Link href={item.href} className={`nav-item${active ? " active" : ""}`}>
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        Simples Apuração RTC · v1.0
        <br />
        IBS/CBS — LC 214/2025
      </div>
    </aside>
  );
}
