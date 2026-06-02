import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Calculator } from "lucide-react";
import { CalculatorCard } from "@/components/calculators/calculator-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { getAlternateLanguagePathnames, getLocalizedPathname } from "@/i18n/paths";
import {
  getAvailableCalculators,
  getCalculatorsByCategory,
  getPrimaryCalculatorsByCategory,
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calculatorDirectory" });

  const canonicalPath = getLocalizedPathname(locale, "/calculadoras");
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    metadataBase: getSiteUrlObject(),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: getAlternateLanguagePathnames("/calculadoras", { includeXDefault: true }),
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

export default async function CalculadorasPage() {
  const locale = await getLocale();
  const t = await getTranslations("calculatorDirectory");
  const tCategories = await getTranslations("calculatorCategories");
  const tCalculators = await getTranslations("calculators");
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");

  const availableCalculators = getAvailableCalculators();
  const visibleCategories = getVisibleCalculatorCategories();
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras");

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    {
      name: tCommon("home"),
      item: absoluteUrl(getLocalizedPathname(locale, "/")),
    },
    {
      name: tNav("calculadoras"),
      item: absoluteUrl(canonicalPath),
    },
  ]);

  const itemListJsonLd = createItemListJsonLd({
    name: t("title"),
    items: availableCalculators.map((calculator) => ({
      name: tCalculators(`${calculator.id}.title`),
      description: tCalculators(`${calculator.id}.description`),
      url: absoluteUrl(getLocalizedPathname(locale, calculator.href)),
    })),
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd} id="calculator-directory-breadcrumb-jsonld" />
      <JsonLd data={itemListJsonLd} id="calculator-directory-itemlist-jsonld" />

      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("calculadoras") },
        ]}
      />

      <div className="mb-10">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <Calculator className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{t("description")}</p>
      </div>

      <section aria-labelledby="categorias" className="scroll-mt-20">
        <div className="mb-5">
          <h2 id="categorias" className="text-2xl font-semibold tracking-tight">
            {t("categoriesTitle")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCategories.map((category) => {
            const Icon = category.icon;
            const calculatorCount = getCalculatorsByCategory(category.id).length;

            return (
              <Link
                key={category.id}
                href={category.href}
                data-testid={`calculator-category-card-${category.slug}`}
                className="group flex h-full flex-col rounded-lg border bg-card p-5 transition-all hover:border-emerald-300 hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold group-hover:text-emerald-600">
                    {tCategories(`${category.id}.title`)}
                  </h3>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {tCategories(`${category.id}.description`)}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm font-medium text-emerald-600">
                  <span>{t("calculatorCount", { count: calculatorCount })}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="todas-calculadoras" className="mt-14 scroll-mt-20">
        <div className="mb-6">
          <h2 id="todas-calculadoras" className="text-2xl font-semibold tracking-tight">
            {t("allTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("allDescription")}</p>
        </div>

        <div className="space-y-10">
          {visibleCategories.map((category) => {
            const categoryCalculators = getPrimaryCalculatorsByCategory(category.id);
            if (categoryCalculators.length === 0) return null;

            return (
              <section key={category.id} aria-labelledby={`categoria-${category.slug}`}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 id={`categoria-${category.slug}`} className="text-xl font-semibold tracking-tight">
                      {tCategories(`${category.id}.title`)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tCategories(`${category.id}.description`)}
                    </p>
                  </div>
                  <Link
                    href={category.href}
                    className="hidden shrink-0 items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 sm:flex">
                    {t("viewCategory")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {categoryCalculators.map((calculator) => (
                    <CalculatorCard key={calculator.id} calculatorId={calculator.id} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
