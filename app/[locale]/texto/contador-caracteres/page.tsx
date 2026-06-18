import type { Metadata } from "next";
import { CharacterCounterClient } from "@/components/tools/text/character-counter-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "contador-caracteres");
}

export default function CharacterCounterPage() {
  return (
    <ToolPageLayout toolId="contador-caracteres">
      <CharacterCounterClient />
    </ToolPageLayout>
  );
}
