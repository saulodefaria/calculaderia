import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { UrlEncodeDecodeClient } from "@/components/tools/dev/url-encode-decode-client";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "url-encode-decode");
}

export default async function UrlEncodeDecodePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="url-encode-decode">
      <Suspense fallback={null}>
        <UrlEncodeDecodeClient />
      </Suspense>
    </ToolPageLayout>
  );
}
