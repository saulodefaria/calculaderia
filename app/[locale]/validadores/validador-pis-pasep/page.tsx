import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PisPasepValidatorClient } from "@/components/tools/validators/pis-pasep-validator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "validador-pis-pasep");
}

export default async function PisPasepValidatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="validador-pis-pasep">
      <Suspense fallback={null}>
        <PisPasepValidatorClient />
      </Suspense>
    </ToolPageLayout>
  );
}
