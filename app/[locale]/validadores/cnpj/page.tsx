import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DocumentValidatorClient } from "@/components/tools/validators/document-validator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "cnpj");
}

export default async function CnpjPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="cnpj">
      <DocumentValidatorClient kind="cnpj" />
    </ToolPageLayout>
  );
}
