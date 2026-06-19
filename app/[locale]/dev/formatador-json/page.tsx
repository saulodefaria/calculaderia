import type { Metadata } from "next";
import { JsonFormatterClient } from "@/components/tools/dev/json-formatter-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "formatador-json");
}

export default function JsonFormatterPage() {
  return (
    <ToolPageLayout toolId="formatador-json">
      <JsonFormatterClient />
    </ToolPageLayout>
  );
}
