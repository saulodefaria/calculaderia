import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PercentageClient } from "@/components/tools/math/percentage-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "porcentagem");
}

export default async function PorcentagemPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="porcentagem">
      <PercentageClient />
    </ToolPageLayout>
  );
}
