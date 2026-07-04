import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ColorPaletteClient } from "@/components/tools/colors/color-palette-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "paleta-cores");
}

export default async function ColorPalettePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="paleta-cores">
      <ColorPaletteClient />
    </ToolPageLayout>
  );
}
