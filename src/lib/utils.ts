// Utilitários de formatação e coerção numérica.

export function formatBRL(value: number | undefined | null): string {
  const v = Number.isFinite(value as number) ? (value as number) : 0;
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(value: number | undefined | null): string {
  const v = Number.isFinite(value as number) ? (value as number) : 0;
  return v.toLocaleString("pt-BR");
}

export function formatPercent(value: number | undefined | null, digits = 2): string {
  const v = Number.isFinite(value as number) ? (value as number) : 0;
  return `${v.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

/** Coerção segura: aceita number, string "1.234,56" ou "1234.56", undefined. */
export function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const s = String(value).trim();
  if (!s) return 0;
  const parsed = Number(s);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Texto seguro a partir de nó XML (pode ser objeto, número ou string). */
export function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value).trim();
}

/** Raiz do CNPJ (8 primeiros dígitos) — identifica o grupo econômico. */
export function cnpjRoot(cnpjCpf: string | undefined): string {
  if (!cnpjCpf) return "";
  const digits = cnpjCpf.replace(/\D/g, "");
  return digits.slice(0, 8);
}

/** Garante array a partir de nó que o parser pode retornar como objeto único. */
export function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function formatPeriodLabel(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${months[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}
