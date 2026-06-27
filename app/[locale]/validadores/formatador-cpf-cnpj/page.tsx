import type { Metadata } from "next";
import { CpfCnpjFormatterClient } from "@/components/tools/validators/cpf-cnpj-formatter-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "formatador-cpf-cnpj");
}

export default function CpfCnpjFormatterPage() {
  return (
    <ToolPageLayout toolId="formatador-cpf-cnpj">
      <CpfCnpjFormatterClient />
    </ToolPageLayout>
  );
}
