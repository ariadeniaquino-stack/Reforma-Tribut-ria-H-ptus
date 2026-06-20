import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simples Apuração RTC · HAPTUS",
  description:
    "Apuração de créditos e débitos de IBS/CBS (Reforma Tributária do Consumo — LC 214/2025). HAPTUS Assessoria Contábil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
