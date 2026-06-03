import type { Metadata } from "next";
import { ToolsHubPage } from "@/components/tools/tools-hub-page";
import { generateToolsHubMetadata } from "@/lib/tools/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateToolsHubMetadata(locale);
}

export default function FerramentasPage() {
  return <ToolsHubPage />;
}
