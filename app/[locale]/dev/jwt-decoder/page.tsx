import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { JwtDecoderClient } from "@/components/tools/dev/jwt-decoder-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "jwt-decoder");
}

export default async function JwtDecoderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ToolPageLayout locale={locale} toolId="jwt-decoder">
      <Suspense fallback={null}>
        <JwtDecoderClient />
      </Suspense>
    </ToolPageLayout>
  );
}
