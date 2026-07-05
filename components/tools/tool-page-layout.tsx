import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ToolMessagesProvider } from "@/components/i18n/tool-messages-provider";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getLocalizedPathname } from "@/i18n/paths";
import { getToolById, getToolFamilyForTool, getToolPrimaryCategory } from "@/lib/constants";
import { absoluteUrl, createBreadcrumbJsonLd, createSoftwareApplicationJsonLd } from "@/lib/seo";

interface ToolPageLayoutProps {
  toolId: string;
  locale: string;
  children: ReactNode;
}

function ToolSkeleton() {
  return (
    <div className="mb-8 animate-pulse rounded-lg border bg-card p-6">
      <div className="mb-6 h-6 w-48 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-10 rounded bg-muted" />
    </div>
  );
}

export async function ToolPageLayout({ toolId, locale, children }: ToolPageLayoutProps) {
  const tool = getToolById(toolId);
  if (!tool) notFound();

  const family = getToolFamilyForTool(tool.id);
  const category = getToolPrimaryCategory(tool.id);
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tFamilies = await getTranslations({ locale, namespace: "toolFamilies" });
  const tCategories = await getTranslations({ locale, namespace: "toolCategories" });
  const tTools = await getTranslations({
    locale,
    namespace: tool.familyId === "calculadoras" ? "calculators" : "tools",
  });
  const canonicalPath = getLocalizedPathname(locale, tool.href);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const title = tTools(`${tool.id}.title`);
  const description = tTools(`${tool.id}.description`);

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
      item: absoluteUrl(getLocalizedPathname(locale, category.href)),
    },
    {
      name: title,
      item: canonicalUrl,
    },
  ]);

  const softwareApplicationJsonLd = createSoftwareApplicationJsonLd({
    name: title,
    url: canonicalUrl,
    description,
    applicationCategory: tool.seoApplicationCategory,
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd} id={`${tool.id}-breadcrumb-jsonld`} />
      <JsonLd data={softwareApplicationJsonLd} id={`${tool.id}-software-jsonld`} />

      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("ferramentas"), href: "/ferramentas" },
          { label: tFamilies(`${family.id}.title`), href: family.href },
          { label: tCategories(`${category.id}.title`), href: category.href },
          { label: title },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="max-w-3xl text-muted-foreground">{description}</p>
      </div>

      <Suspense fallback={<ToolSkeleton />}>
        <ToolMessagesProvider locale={locale} toolId={tool.id}>
          {children}
        </ToolMessagesProvider>
      </Suspense>

      {tool.familyId !== "calculadoras" ? (
        <article className="mt-12 space-y-6">
          <section aria-labelledby={`${tool.id}-sobre`}>
            <h2 id={`${tool.id}-sobre`} className="text-2xl font-semibold tracking-tight">
              {tTools(`${tool.id}.seo.aboutTitle`)}
            </h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p>{tTools(`${tool.id}.seo.about`)}</p>
            </div>
          </section>
          <section aria-labelledby={`${tool.id}-uso`}>
            <h2 id={`${tool.id}-uso`} className="text-2xl font-semibold tracking-tight">
              {tTools(`${tool.id}.seo.howToUseTitle`)}
            </h2>
            <p className="mt-4 text-muted-foreground">{tTools(`${tool.id}.seo.howToUse`)}</p>
          </section>
        </article>
      ) : null}
    </div>
  );
}
