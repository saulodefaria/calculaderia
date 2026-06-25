import type { Metadata } from "next";
import { CaseConverterClient } from "@/components/tools/text/case-converter-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "conversor-maiusculas");
}

export default function CaseConverterPage() {
  return (
    <ToolPageLayout toolId="conversor-maiusculas">
      <CaseConverterClient />
    </ToolPageLayout>
  );
}
