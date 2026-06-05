import type { Metadata } from "next";
import { QrCodeClient } from "@/components/tools/generators/qr-code-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "qr-code");
}

export default function QrCodePage() {
  return (
    <ToolPageLayout toolId="qr-code">
      <QrCodeClient />
    </ToolPageLayout>
  );
}
