"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Calculator, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { useFiscalStore } from "@/application/store/useFiscalStore";
import { TaxAnalyzerService } from "@/application/services/TaxAnalyzerService";
import { formatBRL, formatPercent } from "@/lib/utils";

export default function AnalysisPage() {
  const documents = useFiscalStore((s) => s.documents);

  if (documents.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <div className="empty-icon"><Calculator size={26} /></div>
          <h3>Sem dados para apurar</h3>
          <p>Carregue documentos fiscais para visualizar a apuração de IBS/CBS.</p>
        </div>
      </div>
    );
  }

  const a = TaxAnalyzerService.calculateApuracao(documents);
  const cfops = TaxAnalyzerService.groupByCfop(documents).slice(0, 10);

  return (
    <div>
      <div className="grid grid-kpi">
        <div className="kpi">
          <div className="kpi-label"><TrendingUp size={14} /> Créditos</div>
          <div className="kpi-value kpi-accent-credit">{formatBRL(a.credito)}</div>
          <div className="kpi-sub">{formatPercent(a.creditRate)} sobre compras</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><TrendingDown size={14} /> Débitos</div>
          <div className="kpi-value kpi-accent-debit">{formatBRL(a.debito)}</div>
          <div className="kpi-sub">{formatPercent(a.debitRate)} sobre vendas</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><Scale size={14} /> Saldo</div>
          <div className="kpi-value kpi-accent-brand">{formatBRL(a.saldo)}</div>
          <div className="kpi-sub">
            <span className={`badge ${a.position === "CREDORA" ? "badge-ok" : a.position === "DEVEDORA" ? "badge-danger" : "badge-muted"}`}>
              Posição {a.position}
            </span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Efeito líquido s/ vendas</div>
          <div className="kpi-value">{formatPercent(a.balanceRate)}</div>
          <div className="kpi-sub">peso por R$ vendido</div>
        </div>
      </div>

      <div className="card card-pad mt">
        <div className="card-title">Crédito × Débito por CFOP</div>
        {cfops.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Sem CFOPs com IBS/CBS destacado.</p>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={cfops} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" vertical={false} />
              <XAxis dataKey="cfop" tick={{ fontSize: 12, fill: "#74878a" }} />
              <YAxis tick={{ fontSize: 12, fill: "#74878a" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => formatBRL(v)}
                contentStyle={{ borderRadius: 10, border: "1px solid #e3ebe9", fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="credito" name="Crédito" fill="#2f9e7f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="debito" name="Débito" fill="#cf4f45" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card card-pad mt">
        <div className="card-title">Detalhamento por CFOP</div>
        <div className="table-wrap" style={{ border: "none" }}>
          <table className="data">
            <thead>
              <tr><th>CFOP</th><th>Categoria</th><th className="num">Crédito</th><th className="num">Débito</th></tr>
            </thead>
            <tbody>
              {cfops.map((c) => (
                <tr key={c.cfop}>
                  <td className="mono">{c.cfop}</td>
                  <td>{c.category}</td>
                  <td className="num" style={{ color: "var(--ok)" }}>{formatBRL(c.credito)}</td>
                  <td className="num" style={{ color: "var(--danger)" }}>{formatBRL(c.debito)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="notice notice-warn mt">
        <Calculator size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Apuração baseada nos valores efetivamente destacados nos XMLs. Durante 2026–2032
          vigoram <strong>alíquotas de transição</strong>; a regulamentação da LC 214/2025
          ainda está em construção.
        </span>
      </div>
    </div>
  );
}
