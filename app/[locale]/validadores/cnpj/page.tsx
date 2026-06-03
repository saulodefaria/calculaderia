import type { Metadata } from "next";
import { DocumentValidatorClient } from "@/components/tools/validators/document-validator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "cnpj");
}

export default function CnpjPage() {
  return (
    <ToolPageLayout toolId="cnpj">
      <DocumentValidatorClient kind="cnpj" />
    </ToolPageLayout>
  );
}
