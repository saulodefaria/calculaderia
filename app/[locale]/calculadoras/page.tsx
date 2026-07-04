import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ToolFamilyDirectoryPage } from "@/components/tools/tool-family-directory-page";
import { generateToolFamilyMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolFamilyMetadata(locale, "calculadoras");
}

export default async function CalculadorasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ToolFamilyDirectoryPage locale={locale} familyId="calculadoras" />;
}
