import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { getLocalizedPathname } from "@/i18n/paths";
import {
  getToolCategoryBySlug,
  getToolFamilyBySlug,
  getToolsByCategory,
  getVisibleToolCategories,
  type ToolDefinition,
} from "@/lib/constants";
import { absoluteUrl, createBreadcrumbJsonLd, createItemListJsonLd } from "@/lib/seo";

interface ToolCategoryDirectoryPageProps {
  familySlug: string;
  categorySlug: string;
}

export async function ToolCategoryDirectoryPage({ familySlug, categorySlug }: ToolCategoryDirectoryPageProps) {
  const locale = await getLocale();
  const family = getToolFamilyBySlug(familySlug);
  const category = family ? getToolCategoryBySlug(family.id, categorySlug) : undefined;
  const visibleCategoryIds = new Set(getVisibleToolCategories(family?.id).map((item) => item.id));

  if (!family || !category || !visibleCategoryIds.has(category.id)) {
    notFound();
  }

  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const tFamilies = await getTranslations("toolFamilies");
  const tCategories = await getTranslations("toolCategories");
  const tCategoryPage = await getTranslations("toolCategoryPage");
  const tTools = await getTranslations("tools");
  const tCalculators = await getTranslations("calculators");

  const categoryTools = getToolsByCategory(category.id).filter((tool) => tool.familyId === family.id);
  const categoryPath = getLocalizedPathname(locale, category.href);
  const Icon = category.icon;

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
      item: absoluteUrl(getLocalizedPathname(locale, family.href)),
    },
    {
      name: tCategories(`${category.id}.title`),
      item: absoluteUrl(categoryPath),
    },
  ]);

  const itemListJsonLd = createItemListJsonLd({
    name: tCategories(`${category.id}.title`),
    items: categoryTools.map((tool) => ({
      name: getToolTitle(tool),
      description: getToolDescription(tool),
      url: absoluteUrl(getLocalizedPathname(locale, tool.href)),
    })),
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd} id={`${family.slug}-${category.slug}-breadcrumb-jsonld`} />
      <JsonLd data={itemListJsonLd} id={`${family.slug}-${category.slug}-itemlist-jsonld`} />

      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("ferramentas"), href: "/ferramentas" },
          { label: tFamilies(`${family.id}.title`), href: family.href },
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

      <section aria-labelledby={`${category.slug}-ferramentas`}>
        <div className="mb-6">
          <h2 id={`${category.slug}-ferramentas`} className="text-2xl font-semibold tracking-tight">
            {tCategoryPage("toolsTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {tCategoryPage("toolsDescription", {
              category: tCategories(`${category.id}.title`).toLocaleLowerCase(locale),
            })}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {categoryTools.map((tool) => (
            <ToolCard key={tool.id} toolId={tool.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
