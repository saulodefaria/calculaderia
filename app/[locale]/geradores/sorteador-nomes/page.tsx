import { Suspense } from "react";
import type { Metadata } from "next";
import { NameDrawerClient } from "@/components/tools/generators/name-drawer-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "sorteador-nomes");
}

export default function SorteadorNomesPage() {
  return (
    <ToolPageLayout toolId="sorteador-nomes">
      <Suspense fallback={null}>
        <NameDrawerClient />
      </Suspense>
    </ToolPageLayout>
  );
}
