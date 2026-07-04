import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import {
  getAvailableTools,
  getPopularTools,
  getRecentTools,
  getToolsByFamily,
  getVisibleToolFamilies,
  type ToolDefinition,
} from "@/lib/constants";
import { absoluteUrl, createBreadcrumbJsonLd, createItemListJsonLd } from "@/lib/seo";

interface ToolsHubPageProps {
  locale: string;
}

export async function ToolsHubPage({ locale }: ToolsHubPageProps) {
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tDirectory = await getTranslations({ locale, namespace: "toolDirectory" });
  const tFamilies = await getTranslations({ locale, namespace: "toolFamilies" });
  const tTools = await getTranslations({ locale, namespace: "tools" });
  const tCalculators = await getTranslations({ locale, namespace: "calculators" });

  const families = getVisibleToolFamilies();
  const popularTools = getPopularTools().slice(0, 8);
  const recentTools = getRecentTools().slice(0, 8);
  const availableTools = getAvailableTools();
  const canonicalPath = getLocalizedPathname(locale, "/ferramentas");

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
      item: absoluteUrl(canonicalPath),
    },
  ]);

  const itemListJsonLd = createItemListJsonLd({
    name: tDirectory("title"),
    items: availableTools.map((tool) => ({
      name: getToolTitle(tool),
      description: getToolDescription(tool),
      url: absoluteUrl(getLocalizedPathname(locale, tool.href)),
    })),
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd} id="tools-hub-breadcrumb-jsonld" />
      <JsonLd data={itemListJsonLd} id="tools-hub-itemlist-jsonld" />

      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("ferramentas") },
        ]}
      />

      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tDirectory("title")}</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{tDirectory("description")}</p>
      </div>

      <section aria-labelledby="familias-ferramentas" className="scroll-mt-20">
        <div className="mb-5">
          <h2 id="familias-ferramentas" className="text-2xl font-semibold tracking-tight">
            {tDirectory("familiesTitle")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {families.map((family) => {
            const Icon = family.icon;
            const toolCount = getToolsByFamily(family.id).length;

            return (
              <Link
                key={family.id}
                href={family.href}
                data-testid={`tool-family-card-${family.slug}`}
                className="group flex h-full flex-col rounded-lg border bg-card p-5 transition-all hover:border-emerald-300 hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold group-hover:text-emerald-600">
                    {tFamilies(`${family.id}.title`)}
                  </h3>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {tFamilies(`${family.id}.description`)}
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

      <section aria-labelledby="ferramentas-populares" className="mt-14 scroll-mt-20">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <h2 id="ferramentas-populares" className="text-2xl font-semibold tracking-tight">
            {tDirectory("popularTitle")}
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} toolId={tool.id} />
          ))}
        </div>
      </section>

      <section aria-labelledby="ferramentas-recentes" className="mt-14 scroll-mt-20">
        <div className="mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600" />
          <h2 id="ferramentas-recentes" className="text-2xl font-semibold tracking-tight">
            {tDirectory("recentTitle")}
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {recentTools.map((tool) => (
            <ToolCard key={tool.id} toolId={tool.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
