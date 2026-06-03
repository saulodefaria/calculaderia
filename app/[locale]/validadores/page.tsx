import type { Metadata } from "next";
import { ToolFamilyDirectoryPage } from "@/components/tools/tool-family-directory-page";
import { generateToolFamilyMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolFamilyMetadata(locale, "validadores");
}

export default function ValidadoresPage() {
  return <ToolFamilyDirectoryPage familyId="validadores" />;
}
