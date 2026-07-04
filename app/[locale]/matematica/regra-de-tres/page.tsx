import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { RuleOfThreeClient } from "@/components/tools/math/rule-of-three-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "regra-de-tres");
}

export default async function RegraDeTresPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="regra-de-tres">
      <RuleOfThreeClient />
    </ToolPageLayout>
  );
}
