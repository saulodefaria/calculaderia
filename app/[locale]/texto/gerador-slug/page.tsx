import { Suspense } from "react";
import type { Metadata } from "next";
import { SlugGeneratorClient } from "@/components/tools/text/slug-generator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "gerador-slug");
}

export default function SlugGeneratorPage() {
  return (
    <ToolPageLayout toolId="gerador-slug">
      <Suspense fallback={null}>
        <SlugGeneratorClient />
      </Suspense>
    </ToolPageLayout>
  );
}
