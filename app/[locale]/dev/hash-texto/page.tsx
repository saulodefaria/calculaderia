import { Suspense } from "react";
import type { Metadata } from "next";
import { HashTextClient } from "@/components/tools/dev/hash-text-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "hash-texto");
}

export default function HashTextPage() {
  return (
    <ToolPageLayout toolId="hash-texto">
      <Suspense fallback={null}>
        <HashTextClient />
      </Suspense>
    </ToolPageLayout>
  );
}
