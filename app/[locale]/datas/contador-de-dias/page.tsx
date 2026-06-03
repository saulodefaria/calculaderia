import type { Metadata } from "next";
import { DayCounterClient } from "@/components/tools/dates/day-counter-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "contador-de-dias");
}

export default function ContadorDeDiasPage() {
  return (
    <ToolPageLayout toolId="contador-de-dias">
      <DayCounterClient />
    </ToolPageLayout>
  );
}
