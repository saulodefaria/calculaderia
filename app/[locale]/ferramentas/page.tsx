import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ToolsHubPage } from "@/components/tools/tools-hub-page";
import { generateToolsHubMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolsHubMetadata(locale);
}

export default async function FerramentasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ToolsHubPage locale={locale} />;
}
