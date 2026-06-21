import type { Metadata } from "next";
import { Base64ConverterClient } from "@/components/tools/dev/base64-converter-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "conversor-base64");
}

export default function Base64ConverterPage() {
  return (
    <ToolPageLayout toolId="conversor-base64">
      <Base64ConverterClient />
    </ToolPageLayout>
  );
}
