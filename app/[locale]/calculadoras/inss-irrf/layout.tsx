import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getAlternateLanguagePathnames, getLocalizedPathname } from "@/i18n/paths";
import { getOpenGraphImages, getTwitterImages } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calculators.inss-irrf" });

  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/inss-irrf");
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: getAlternateLanguagePathnames("/calculadoras/inss-irrf"),
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
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

export default async function InssIrrfLayout({
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
