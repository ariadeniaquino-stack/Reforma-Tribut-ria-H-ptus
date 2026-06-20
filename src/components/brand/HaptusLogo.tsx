// Marca HAPTUS — recriação vetorial original (monograma "H" + wordmark).
// Paleta da marca: verde-petróleo + grafite.

export function HaptusMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="42" height="42" rx="11" fill="var(--brand-50)" />
      {/* Hastes do H */}
      <rect x="13" y="12" width="6.5" height="24" rx="3" fill="var(--brand)" />
      <rect x="28.5" y="12" width="6.5" height="24" rx="3" fill="var(--brand-700)" />
      {/* Travessão diagonal dinâmico */}
      <path
        d="M19.5 26.5 L28.5 18.5 L28.5 24 L19.5 32 Z"
        fill="var(--brand-600)"
      />
    </svg>
  );
}

export function HaptusLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <HaptusMark size={compact ? 30 : 36} />
      <div style={{ lineHeight: 1.05 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: compact ? 17 : 19,
            letterSpacing: "0.02em",
            color: "var(--ink)",
          }}
        >
          HAPTUS
        </div>
        <div style={{ fontSize: 10.5, color: "var(--brand-600)", fontWeight: 600, letterSpacing: "0.06em" }}>
          ASSESSORIA CONTÁBIL
        </div>
      </div>
    </div>
  );
}
