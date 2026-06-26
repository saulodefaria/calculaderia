import { Suspense } from "react";
import type { Metadata } from "next";
import { EmailValidatorClient } from "@/components/tools/validators/email-validator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "validador-email");
}

export default function EmailValidatorPage() {
  return (
    <ToolPageLayout toolId="validador-email">
      <Suspense fallback={null}>
        <EmailValidatorClient />
      </Suspense>
    </ToolPageLayout>
  );
}
