import { Suspense } from "react";
import type { Metadata } from "next";
import { UnixTimestampClient } from "@/components/tools/dates/unix-timestamp-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "unix-timestamp");
}

export default function UnixTimestampPage() {
  return (
    <ToolPageLayout toolId="unix-timestamp">
      <Suspense fallback={null}>
        <UnixTimestampClient />
      </Suspense>
    </ToolPageLayout>
  );
}
