import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CpfCnpjFormatterClient } from "@/components/tools/validators/cpf-cnpj-formatter-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "formatador-cpf-cnpj");
}

export default async function CpfCnpjFormatterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="formatador-cpf-cnpj">
      <CpfCnpjFormatterClient />
    </ToolPageLayout>
  );
}
