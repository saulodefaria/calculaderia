import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getAlternateLanguagePathnames, getLocalizedPathname } from "@/i18n/paths";
import { guides, getGuideBySlug } from "@/lib/guides";
import { getOpenGraphImages, getTwitterImages } from "@/lib/seo";

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];

  for (const locale of routing.locales) {
    for (const guide of guides) {
      params.push({ locale, slug: guide.slug });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "guides" });

  const canonicalPath = getLocalizedPathname(locale, `/guias/${slug}`);
  const titleKey = guide.metaTitleKey.replace("guides.", "");
  const descriptionKey = guide.metaDescriptionKey.replace("guides.", "");

  const title = t(titleKey);
  const description = t(descriptionKey);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: getAlternateLanguagePathnames(`/guias/${slug}`),
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "article",
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

export default async function GuideLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const guide = getGuideBySlug(slug);
  if (!guide) {
    notFound();
  }

  return children;
}
