import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apoiar | Calculadoras Financeiras",
  description: "Apoie o projeto Calculadoras Financeiras e ajude a manter as ferramentas gratuitas para todos.",
};

export default function ApoiarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
