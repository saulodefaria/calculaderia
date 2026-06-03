import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getAlternateLanguagePathnames, getLocalizedPathname } from "@/i18n/paths";
import {
  getToolById,
  getToolCategoryBySlug,
  getToolFamilyById,
  getToolFamilyBySlug,
  getVisibleToolCategories,
  type ToolFamilyId,
} from "@/lib/constants";
import { getOpenGraphImages, getSiteUrlObject, getTwitterImages } from "@/lib/seo";

export async function generateToolsHubMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "toolDirectory" });
  const canonicalPath = getLocalizedPathname(locale, "/ferramentas");
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    metadataBase: getSiteUrlObject(),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: getAlternateLanguagePathnames("/ferramentas", { includeXDefault: true }),
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

export async function generateToolFamilyMetadata(locale: string, familyId: ToolFamilyId): Promise<Metadata> {
  const family = getToolFamilyById(familyId);
  if (!family) notFound();

  const t = await getTranslations({ locale, namespace: "toolFamilies" });
  const canonicalPath = getLocalizedPathname(locale, family.href);
  const title = t(`${family.id}.metaTitle`);
  const description = t(`${family.id}.metaDescription`);

  return {
    metadataBase: getSiteUrlObject(),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: getAlternateLanguagePathnames(family.href, { includeXDefault: true }),
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

export async function generateToolCategoryMetadata(
  locale: string,
  familySlug: string,
  categorySlug: string
): Promise<Metadata> {
  const family = getToolFamilyBySlug(familySlug);
  const category = family ? getToolCategoryBySlug(family.id, categorySlug) : undefined;
  const visibleCategoryIds = new Set(getVisibleToolCategories(family?.id).map((item) => item.id));

  if (!family || !category || !visibleCategoryIds.has(category.id)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "toolCategories" });
  const canonicalPath = getLocalizedPathname(locale, category.href);
  const title = t(`${category.id}.metaTitle`);
  const description = t(`${category.id}.metaDescription`);

  return {
    metadataBase: getSiteUrlObject(),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: getAlternateLanguagePathnames(category.href, { includeXDefault: true }),
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

export async function generateToolPageMetadata(locale: string, toolId: string): Promise<Metadata> {
  const tool = getToolById(toolId);
  if (!tool) notFound();

  const t = await getTranslations({ locale, namespace: tool.familyId === "calculadoras" ? "calculators" : "tools" });
  const canonicalPath = getLocalizedPathname(locale, tool.href);
  const title = t(`${tool.id}.metaTitle`);
  const description = t(`${tool.id}.metaDescription`);

  return {
    metadataBase: getSiteUrlObject(),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: getAlternateLanguagePathnames(tool.href, { includeXDefault: true }),
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
