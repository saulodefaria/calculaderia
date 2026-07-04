import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ToolCategoryDirectoryPage } from "@/components/tools/tool-category-directory-page";
import { routing } from "@/i18n/routing";
import { getToolFamilyById, getVisibleToolCategories } from "@/lib/constants";
import { generateToolCategoryMetadata } from "@/lib/tools/metadata";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getVisibleToolCategories()
      .filter((category) => category.familyId !== "calculadoras")
      .map((category) => ({
        locale,
        familySlug: getToolFamilyById(category.familyId)?.slug ?? category.familyId,
        categorySlug: category.slug,
      }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; familySlug: string; categorySlug: string }>;
}): Promise<Metadata> {
  const { locale, familySlug, categorySlug } = await params;
  return generateToolCategoryMetadata(locale, familySlug, categorySlug);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; familySlug: string; categorySlug: string }>;
}) {
  const { locale, familySlug, categorySlug } = await params;
  setRequestLocale(locale);

  return <ToolCategoryDirectoryPage familySlug={familySlug} categorySlug={categorySlug} locale={locale} />;
}
