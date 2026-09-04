import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { TituloEleitorValidatorClient } from "@/components/tools/validators/titulo-eleitor-validator-client";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "validador-titulo-eleitor");
}

export default async function TituloEleitorValidatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="validador-titulo-eleitor">
      <Suspense fallback={null}>
        <TituloEleitorValidatorClient />
      </Suspense>
    </ToolPageLayout>
  );
}
