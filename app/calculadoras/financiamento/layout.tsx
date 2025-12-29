import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Financiamento",
  description:
    "Simule seu financiamento usando os sistemas SAC ou PRICE. Visualize a tabela de amortização completa com todas as parcelas.",
};

export default function FinanciamentoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
