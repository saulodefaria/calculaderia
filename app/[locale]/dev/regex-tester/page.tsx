import type { Metadata } from "next";
import { RegexTesterClient } from "@/components/tools/dev/regex-tester-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "regex-tester");
}

export default function RegexTesterPage() {
  return (
    <ToolPageLayout toolId="regex-tester">
      <RegexTesterClient />
    </ToolPageLayout>
  );
}
