import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LicensePlateValidatorClient } from "@/components/tools/validators/license-plate-validator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "validador-placa");
}

export default async function LicensePlateValidatorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="validador-placa">
      <Suspense fallback={null}>
        <LicensePlateValidatorClient />
      </Suspense>
    </ToolPageLayout>
  );
}
