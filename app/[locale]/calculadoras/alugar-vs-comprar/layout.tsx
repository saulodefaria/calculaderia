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
  const t = await getTranslations({ locale, namespace: "calculators.alugar-vs-comprar" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: {
        "pt-BR": "/calculadoras/alugar-vs-comprar",
        en: "/en/calculadoras/alugar-vs-comprar",
      },
    },
  };
}

export default async function AluguelVsComprarLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return children;
}
