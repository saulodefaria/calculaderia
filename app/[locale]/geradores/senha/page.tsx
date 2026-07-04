import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PasswordGeneratorClient } from "@/components/tools/generators/password-generator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "senha");
}

export default async function SenhaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="senha">
      <PasswordGeneratorClient />
    </ToolPageLayout>
  );
}
