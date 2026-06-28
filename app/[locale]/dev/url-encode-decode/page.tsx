import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { UrlEncodeDecodeClient } from "@/components/tools/dev/url-encode-decode-client";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "url-encode-decode");
}

export default function UrlEncodeDecodePage() {
  return (
    <ToolPageLayout toolId="url-encode-decode">
      <UrlEncodeDecodeClient />
    </ToolPageLayout>
  );
}
