import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { RegexTesterClient } from "@/components/tools/dev/regex-tester-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "regex-tester");
}

export default async function RegexTesterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="regex-tester">
      <RegexTesterClient />
    </ToolPageLayout>
  );
}
