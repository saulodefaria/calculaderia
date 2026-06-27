import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentCardValidatorClient } from "@/components/tools/validators/payment-card-validator-client";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { generateToolPageMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolPageMetadata(locale, "validador-cartao");
}

export default function PaymentCardValidatorPage() {
  return (
    <ToolPageLayout toolId="validador-cartao">
      <Suspense fallback={null}>
        <PaymentCardValidatorClient />
      </Suspense>
    </ToolPageLayout>
  );
}
