import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aluguel vs Comprar",
  description: "Compare se é melhor comprar um imóvel financiado ou alugar e investir a diferença.",
};

export default function AluguelVsComprarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
