import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Consórcio",
  description:
    "Simule as parcelas do seu consórcio com correção anual por INCC/IPCA. Visualize a tabela completa de parcelas e acompanhe como o valor aumenta ao longo do tempo.",
};

export default function ConsorcioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
