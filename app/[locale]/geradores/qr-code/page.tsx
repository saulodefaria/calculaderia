import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { QrCodeClient } from "@/components/tools/generators/qr-code-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "qr-code");
}

export default async function QrCodePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="qr-code">
      <QrCodeClient />
    </ToolPageLayout>
  );
}
