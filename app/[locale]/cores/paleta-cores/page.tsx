import type { Metadata } from "next";
import { ColorPaletteClient } from "@/components/tools/colors/color-palette-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "paleta-cores");
}

export default function ColorPalettePage() {
  return (
    <ToolPageLayout toolId="paleta-cores">
      <ColorPaletteClient />
    </ToolPageLayout>
  );
}
