import type { Metadata } from "next";
import { RandomNumbersClient } from "@/components/tools/generators/random-numbers-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "numeros-aleatorios");
}

export default function NumerosAleatoriosPage() {
  return (
    <ToolPageLayout toolId="numeros-aleatorios">
      <RandomNumbersClient />
    </ToolPageLayout>
  );
}
