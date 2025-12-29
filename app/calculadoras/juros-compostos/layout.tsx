import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Juros Compostos",
  description:
    "Calcule o rendimento dos seus investimentos com juros compostos ao longo do tempo. Visualize a evolução do investimento com aportes periódicos.",
};

export default function JurosCompostosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
