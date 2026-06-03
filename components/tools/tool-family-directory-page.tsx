import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { Link } from "@/i18n/navigation";
import {
  getToolsByFamily,
  getToolsByCategory,
  getPrimaryToolsByCategory,
  getToolFamilyById,
  getVisibleToolCategories,
  type ToolDefinition,
  type ToolFamilyId,
} from "@/lib/constants";
import { absoluteUrl, createBreadcrumbJsonLd, createItemListJsonLd } from "@/lib/seo";
import { getLocalizedPathname } from "@/i18n/paths";

interface ToolFamilyDirectoryPageProps {
  familyId: ToolFamilyId;
}

function getCategoryCardTestId(familyId: ToolFamilyId, categorySlug: string) {
  if (familyId === "calculadoras") {
    return `calculator-category-card-${categorySlug}`;
  }

  return `tool-category-card-${categorySlug}`;
}

export async function ToolFamilyDirectoryPage({ familyId }: ToolFamilyDirectoryPageProps) {
  const locale = await getLocale();
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const tFamilies = await getTranslations("toolFamilies");
  const tCategories = await getTranslations("toolCategories");
  const tDirectory = await getTranslations("toolFamilyDirectory");
  const tTools = await getTranslations("tools");
  const tCalculators = await getTranslations("calculators");

  const family = getToolFamilyById(familyId);
  if (!family) return null;

  const visibleCategories = getVisibleToolCategories(familyId);
  const familyTools = getToolsByFamily(familyId);
  const canonicalPath = getLocalizedPathname(locale, family.href);
  const Icon = family.icon;

  const getToolTitle = (tool: ToolDefinition) => {
    const t = tool.familyId === "calculadoras" ? tCalculators : tTools;
    return t(`${tool.id}.title`);
  };

  const getToolDescription = (tool: ToolDefinition) => {
    const t = tool.familyId === "calculadoras" ? tCalculators : tTools;
    return t(`${tool.id}.description`);
  };

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
      name: tFamilies(`${family.id}.title`),
      item: absoluteUrl(canonicalPath),
    },
  ]);

  const itemListJsonLd = createItemListJsonLd({
    name: tFamilies(`${family.id}.title`),
    items: familyTools.map((tool) => ({
      name: getToolTitle(tool),
      description: getToolDescription(tool),
      url: absoluteUrl(getLocalizedPathname(locale, tool.href)),
    })),
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd} id={`${family.slug}-directory-breadcrumb-jsonld`} />
      <JsonLd data={itemListJsonLd} id={`${family.slug}-directory-itemlist-jsonld`} />

      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("ferramentas"), href: "/ferramentas" },
          { label: tFamilies(`${family.id}.title`) },
        ]}
      />

      <div className="mb-10">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <Icon className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tFamilies(`${family.id}.title`)}</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{tFamilies(`${family.id}.description`)}</p>
      </div>

      <section aria-labelledby={`${family.slug}-categorias`} className="scroll-mt-20">
        <div className="mb-5">
          <h2 id={`${family.slug}-categorias`} className="text-2xl font-semibold tracking-tight">
            {tDirectory("categoriesTitle")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCategories.map((category) => {
            const CategoryIcon = category.icon;
            const toolCount = getToolsByCategory(category.id).filter((tool) => tool.familyId === familyId).length;

            return (
              <Link
                key={category.id}
                href={category.href}
                data-testid={getCategoryCardTestId(familyId, category.slug)}
                className="group flex h-full flex-col rounded-lg border bg-card p-5 transition-all hover:border-emerald-300 hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <CategoryIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold group-hover:text-emerald-600">
                    {tCategories(`${category.id}.title`)}
                  </h3>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {tCategories(`${category.id}.description`)}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm font-medium text-emerald-600">
                  <span>{tDirectory("toolCount", { count: toolCount })}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby={`${family.slug}-todas`} className="mt-14 scroll-mt-20">
        <div className="mb-6">
          <h2 id={`${family.slug}-todas`} className="text-2xl font-semibold tracking-tight">
            {tDirectory("allTitle", { family: tFamilies(`${family.id}.title`).toLocaleLowerCase(locale) })}
          </h2>
          <p className="mt-2 text-muted-foreground">{tDirectory("allDescription")}</p>
        </div>

        <div className="space-y-10">
          {visibleCategories.map((category) => {
            const categoryTools = getPrimaryToolsByCategory(category.id).filter((tool) => tool.familyId === familyId);
            if (categoryTools.length === 0) return null;

            return (
              <section key={category.id} aria-labelledby={`${family.slug}-categoria-${category.slug}`}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 id={`${family.slug}-categoria-${category.slug}`} className="text-xl font-semibold tracking-tight">
                      {tCategories(`${category.id}.title`)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tCategories(`${category.id}.description`)}
                    </p>
                  </div>
                  <Link
                    href={category.href}
                    className="hidden shrink-0 items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 sm:flex">
                    {tDirectory("viewCategory")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {categoryTools.map((tool) => (
                    <ToolCard key={tool.id} toolId={tool.id} />
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
