import type { Metadata } from "next";
import { PasswordGeneratorClient } from "@/components/tools/generators/password-generator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "senha");
}

export default function SenhaPage() {
  return (
    <ToolPageLayout toolId="senha">
      <PasswordGeneratorClient />
    </ToolPageLayout>
  );
}
