import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { RandomNumbersClient } from "@/components/tools/generators/random-numbers-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "numeros-aleatorios");
}

export default async function NumerosAleatoriosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="numeros-aleatorios">
      <RandomNumbersClient />
    </ToolPageLayout>
  );
}
