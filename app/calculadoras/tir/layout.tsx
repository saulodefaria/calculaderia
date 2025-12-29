import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de TIR",
  description:
    "Calcule a Taxa Interna de Retorno de uma série de fluxos de caixa. Insira valores negativos para saídas (investimentos) e positivos para entradas (retornos).",
};

export default function TirLayout({ children }: { children: React.ReactNode }) {
  return children;
}
