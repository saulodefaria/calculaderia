import type { Metadata } from "next";
import { PercentageClient } from "@/components/tools/math/percentage-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "porcentagem");
}

export default function PorcentagemPage() {
  return (
    <ToolPageLayout toolId="porcentagem">
      <PercentageClient />
    </ToolPageLayout>
  );
}
