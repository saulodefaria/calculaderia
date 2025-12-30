import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale, namespace: "calculators.juros-compostos.seo" });

  const canonicalPath = locale === "en" ? "/en/calculadoras/juros-compostos" : "/calculadoras/juros-compostos";
  const canonicalUrl = absoluteUrl(canonicalPath);
  const title = tSeo("metaTitle");
  const description = tSeo("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "pt-BR": "/calculadoras/juros-compostos",
        en: "/en/calculadoras/juros-compostos",
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function JurosCompostosLayout({
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
