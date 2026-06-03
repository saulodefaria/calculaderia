import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { CalculatorCard } from "@/components/calculators/calculator-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getAlternateLanguagePathnames, getLocalizedPathname } from "@/i18n/paths";
import { routing } from "@/i18n/routing";
import {
  getCalculatorCategoryBySlug,
  getCalculatorsByCategory,
  getVisibleCalculatorCategories,
} from "@/lib/constants";
import {
  absoluteUrl,
  createBreadcrumbJsonLd,
  createItemListJsonLd,
  getOpenGraphImages,
  getSiteUrlObject,
  getTwitterImages,
} from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getVisibleCalculatorCategories().map((category) => ({
      locale,
      categorySlug: category.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string }>;
}): Promise<Metadata> {
  const { locale, categorySlug } = await params;
  const category = getCalculatorCategoryBySlug(categorySlug);
  const visibleCategorySlugs = new Set(getVisibleCalculatorCategories().map((item) => item.slug));

  if (!category || !visibleCategorySlugs.has(category.slug)) {
    notFound();
  }

  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const title = tCategories(`${category.id}.metaTitle`);
  const description = tCategories(`${category.id}.metaDescription`);
  const canonicalPath = getLocalizedPathname(locale, category.href);

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

export default async function CalculatorCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string }>;
}) {
  const { locale, categorySlug } = await params;
  const category = getCalculatorCategoryBySlug(categorySlug);
  const visibleCategorySlugs = new Set(getVisibleCalculatorCategories().map((item) => item.slug));

  if (!category || !visibleCategorySlugs.has(category.slug)) {
    notFound();
  }

  const tCategoryPage = await getTranslations("calculatorCategoryPage");
  const tCategories = await getTranslations("calculatorCategories");
  const tCalculators = await getTranslations("calculators");
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");

  const categoryCalculators = getCalculatorsByCategory(category.id);
  const categoryPath = getLocalizedPathname(locale, category.href);

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    {
      name: tCommon("home"),
      item: absoluteUrl(getLocalizedPathname(locale, "/")),
    },
    {
      name: tNav("ferramentas"),
      item: absoluteUrl(getLocalizedPathname(locale, "/ferramentas")),
    },
    {
      name: tNav("calculadoras"),
      item: absoluteUrl(getLocalizedPathname(locale, "/calculadoras")),
    },
    {
      name: tCategories(`${category.id}.title`),
      item: absoluteUrl(categoryPath),
    },
  ]);

  const itemListJsonLd = createItemListJsonLd({
    name: tCategories(`${category.id}.title`),
    items: categoryCalculators.map((calculator) => ({
      name: tCalculators(`${calculator.id}.title`),
      description: tCalculators(`${calculator.id}.description`),
      url: absoluteUrl(getLocalizedPathname(locale, calculator.href)),
    })),
  });

  const Icon = category.icon;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd} id={`${category.slug}-breadcrumb-jsonld`} />
      <JsonLd data={itemListJsonLd} id={`${category.slug}-itemlist-jsonld`} />

      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("ferramentas"), href: "/ferramentas" },
          { label: tNav("calculadoras"), href: "/calculadoras" },
          { label: tCategories(`${category.id}.title`) },
        ]}
      />

      <div className="mb-10">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <Icon className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tCategories(`${category.id}.title`)}</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
          {tCategories(`${category.id}.description`)}
        </p>
      </div>

      <section aria-labelledby="calculadoras-categoria">
        <div className="mb-6">
          <h2 id="calculadoras-categoria" className="text-2xl font-semibold tracking-tight">
            {tCategoryPage("toolsTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {tCategoryPage("toolsDescription", {
              category: tCategories(`${category.id}.title`).toLocaleLowerCase(locale),
            })}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {categoryCalculators.map((calculator) => (
            <CalculatorCard key={calculator.id} calculatorId={calculator.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
