"use client";

import { useState } from "react";
import {
  ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart,
} from "recharts";
import { LineChart as LineIcon } from "lucide-react";
import { useFiscalStore } from "@/application/store/useFiscalStore";
import { TaxAnalyzerService } from "@/application/services/TaxAnalyzerService";
import { formatBRL } from "@/lib/utils";

export default function TemporalPage() {
  const documents = useFiscalStore((s) => s.documents);
  const [mode, setMode] = useState<"MONTHLY" | "QUARTERLY">("MONTHLY");

  if (documents.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <div className="empty-icon"><LineIcon size={26} /></div>
          <h3>Sem série temporal</h3>
          <p>Carregue documentos de diferentes períodos para ver a evolução.</p>
        </div>
      </div>
    );
  }

  const data = TaxAnalyzerService.groupByPeriod(documents, mode);
  const best = data.reduce((m, p) => (p.saldo > m.saldo ? p : m), data[0]);
  const worst = data.reduce((m, p) => (p.saldo < m.saldo ? p : m), data[0]);

  return (
    <div>
      <div className="row between wrap mb">
        <div className="row" style={{ gap: 8 }}>
          {(["MONTHLY", "QUARTERLY"] as const).map((m) => (
            <button
              key={m}
              className={`btn btn-sm ${mode === m ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setMode(m)}
            >
              {m === "MONTHLY" ? "Mensal" : "Trimestral"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-kpi mb">
        <div className="kpi">
          <div className="kpi-label">Melhor período</div>
          <div className="kpi-value kpi-accent-credit" style={{ fontSize: 21 }}>{best?.label}</div>
          <div className="kpi-sub">saldo {formatBRL(best?.saldo)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pior período</div>
          <div className="kpi-value kpi-accent-debit" style={{ fontSize: 21 }}>{worst?.label}</div>
          <div className="kpi-sub">saldo {formatBRL(worst?.saldo)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Saldo acumulado</div>
          <div className="kpi-value kpi-accent-brand" style={{ fontSize: 21 }}>
            {formatBRL(data[data.length - 1]?.acumulado)}
          </div>
          <div className="kpi-sub">{data.length} período(s)</div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-title">Crédito, Débito e Saldo por período</div>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#74878a" }} />
            <YAxis tick={{ fontSize: 12, fill: "#74878a" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e3ebe9", fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="credito" name="Crédito" fill="#2f9e7f" radius={[4, 4, 0, 0]} />
            <Bar dataKey="debito" name="Débito" fill="#cf4f45" radius={[4, 4, 0, 0]} />
            <Line dataKey="saldo" name="Saldo" stroke="#0f7d70" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="card card-pad mt">
        <div className="card-title">Saldo acumulado</div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#149a8a" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#149a8a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#74878a" }} />
            <YAxis tick={{ fontSize: 12, fill: "#74878a" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ borderRadius: 10, border: "1px solid #e3ebe9", fontSize: 13 }} />
            <Area dataKey="acumulado" name="Acumulado" stroke="#149a8a" strokeWidth={2} fill="url(#accGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
