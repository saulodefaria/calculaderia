import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAlternateLanguagePathnames, getLocalizedPathname } from "@/i18n/paths";
import { absoluteUrl, getOpenGraphImages, getTwitterImages } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const tSeo = await getTranslations({ locale, namespace: "calculators.investimento.seo" });

  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/investimento");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const title = tSeo("metaTitle");
  const description = tSeo("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getAlternateLanguagePathnames("/calculadoras/investimento"),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: getOpenGraphImages(title),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: getTwitterImages(title),
    },
  };
}

export default async function InvestimentoLayout({
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
