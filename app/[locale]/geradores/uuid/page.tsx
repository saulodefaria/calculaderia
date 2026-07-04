import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { UuidGeneratorClient } from "@/components/tools/generators/uuid-generator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "uuid");
}

export default async function UuidPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="uuid">
      <UuidGeneratorClient />
    </ToolPageLayout>
  );
}
