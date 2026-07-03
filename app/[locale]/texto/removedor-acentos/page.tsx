import { Suspense } from "react";
import type { Metadata } from "next";
import { AccentRemoverClient } from "@/components/tools/text/accent-remover-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "removedor-acentos");
}

export default function AccentRemoverPage() {
  return (
    <ToolPageLayout toolId="removedor-acentos">
      <Suspense fallback={null}>
        <AccentRemoverClient />
      </Suspense>
    </ToolPageLayout>
  );
}
