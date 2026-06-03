import type { Metadata } from "next";
import { RuleOfThreeClient } from "@/components/tools/math/rule-of-three-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "regra-de-tres");
}

export default function RegraDeTresPage() {
  return (
    <ToolPageLayout toolId="regra-de-tres">
      <RuleOfThreeClient />
    </ToolPageLayout>
  );
}
