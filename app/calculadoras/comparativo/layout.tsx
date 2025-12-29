import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financiamento vs Consórcio",
  description: "Compare as duas opções lado a lado e descubra qual deixa mais dinheiro no seu bolso.",
};

export default function ComparativoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
