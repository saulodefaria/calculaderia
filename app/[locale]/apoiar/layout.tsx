import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteT = await getTranslations({ locale, namespace: "site" });

  return {
    title: `Apoiar | ${siteT("name")}`,
    description: `Apoie o projeto ${siteT("name")} e ajude a manter as ferramentas gratuitas para todos.`,
    alternates: {
      languages: {
        "pt-BR": "/apoiar",
        en: "/en/apoiar",
      },
    },
  };
}

export default async function ApoiarLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <>{children}</>;
}
