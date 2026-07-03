import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { NameDrawerClient } from "@/components/tools/generators/name-drawer-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "sorteador-nomes");
}

export default async function SorteadorNomesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="sorteador-nomes">
      <Suspense fallback={null}>
        <NameDrawerClient />
      </Suspense>
    </ToolPageLayout>
  );
}
