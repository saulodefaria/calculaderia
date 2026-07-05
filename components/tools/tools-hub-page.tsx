import { getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { AllToolsSearch } from "@/components/tools/all-tools-search";
import { getLocalizedPathname } from "@/i18n/paths";
import { getAvailableTools, type ToolDefinition } from "@/lib/constants";
import { absoluteUrl, createBreadcrumbJsonLd, createItemListJsonLd } from "@/lib/seo";

interface ToolsHubPageProps {
  locale: string;
}

export async function ToolsHubPage({ locale }: ToolsHubPageProps) {
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tDirectory = await getTranslations({ locale, namespace: "toolDirectory" });
  const tTools = await getTranslations({ locale, namespace: "tools" });
  const tCalculators = await getTranslations({ locale, namespace: "calculators" });

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

      <AllToolsSearch />
    </div>
  );
}
