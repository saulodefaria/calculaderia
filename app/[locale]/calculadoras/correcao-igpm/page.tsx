import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CorrecaoIgpmCalculatorClient } from "@/components/calculators/correcao-igpm/correcao-igpm-calculator-client";
import { ToolMessagesProvider } from "@/components/i18n/tool-messages-provider";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { CORRECAO_IGPM_SOURCE_REFERENCES, IGPM_SNAPSHOT } from "@/lib/calculators/correcao-igpm";
import { getCalculatorPrimaryCategory, getToolById } from "@/lib/constants";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd, createSoftwareApplicationJsonLd } from "@/lib/seo";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse rounded-lg border bg-card p-6">
      <div className="mb-6 h-6 w-64 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-10 rounded bg-muted" />
        <div className="h-10 rounded bg-muted" />
      </div>
      <div className="mt-6 h-10 rounded bg-muted" />
    </div>
  );
}

const seoSections = ["howTo", "property", "notAppraisal", "formula", "series", "planReal", "data"] as const;

export default async function CorrecaoIgpmPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.correcao-igpm" });
  const tSeo = await getTranslations({ locale, namespace: "calculators.correcao-igpm.seo" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const category = getCalculatorPrimaryCategory("correcao-igpm");
  const tool = getToolById("correcao-igpm")!;
  const canonicalUrl = absoluteUrl(getLocalizedPathname(locale, "/calculadoras/correcao-igpm"));
  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: tCommon("home"), item: absoluteUrl(getLocalizedPathname(locale, "/")) },
    { name: tNav("ferramentas"), item: absoluteUrl(getLocalizedPathname(locale, "/ferramentas")) },
    { name: tNav("calculadoras"), item: absoluteUrl(getLocalizedPathname(locale, "/calculadoras")) },
    { name: tCategories(`${category.id}.title`), item: absoluteUrl(getLocalizedPathname(locale, category.href)) },
    { name: t("title"), item: canonicalUrl },
  ]);
  const faqJsonLd = createFaqJsonLd(
    faqIds.map((id) => ({ question: tSeo(`faq.items.${id}.question`), answer: tSeo(`faq.items.${id}.answer`) }))
  );
  const softwareJsonLd = createSoftwareApplicationJsonLd({
    name: t("title"),
    description: t("description"),
    url: canonicalUrl,
    applicationCategory: tool.seoApplicationCategory,
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd} id="correcao-igpm-breadcrumb-jsonld" />
      <JsonLd data={softwareJsonLd} id="correcao-igpm-software-jsonld" />
      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("ferramentas"), href: "/ferramentas" },
          { label: tNav("calculadoras"), href: "/calculadoras" },
          { label: tCategories(`${category.id}.title`), href: category.href },
          { label: t("title") },
        ]}
      />
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="max-w-3xl text-muted-foreground">{t("description")}</p>
      </header>

      <Suspense fallback={<CalculatorSkeleton />}>
        <ToolMessagesProvider locale={locale} toolId="correcao-igpm">
          <CorrecaoIgpmCalculatorClient />
        </ToolMessagesProvider>
      </Suspense>

      <article className="mt-12 space-y-10">
        {seoSections.map((section) => (
          <section key={section} aria-labelledby={`correcao-igpm-${section}`}>
            <h2 id={`correcao-igpm-${section}`} className="text-2xl font-semibold tracking-tight">
              {tSeo(`${section}.title`)}
            </h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p>{tSeo(`${section}.p1`)}</p>
              <p>{tSeo(`${section}.p2`)}</p>
            </div>
          </section>
        ))}

        <section aria-labelledby="correcao-igpm-sources">
          <h2 id="correcao-igpm-sources" className="text-2xl font-semibold tracking-tight">{tSeo("sources.title")}</h2>
          <p className="mt-4 text-muted-foreground">{tSeo("sources.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm"><a href={CORRECAO_IGPM_SOURCE_REFERENCES.methodology} target="_blank" rel="noreferrer">{tSeo("sources.methodology")}</a></Button>
            <Button asChild variant="outline" size="sm"><a href={IGPM_SNAPSHOT.sourceUrl} target="_blank" rel="noreferrer">{tSeo("sources.series")}</a></Button>
            <Button asChild variant="outline" size="sm"><a href={CORRECAO_IGPM_SOURCE_REFERENCES.faq} target="_blank" rel="noreferrer">{tSeo("sources.faq")}</a></Button>
            <Button asChild variant="outline" size="sm"><a href={CORRECAO_IGPM_SOURCE_REFERENCES.fgvMethodology} target="_blank" rel="noreferrer">{tSeo("sources.fgv")}</a></Button>
          </div>
        </section>

        <section aria-labelledby="correcao-igpm-related">
          <h2 id="correcao-igpm-related" className="text-2xl font-semibold tracking-tight">{tSeo("related.title")}</h2>
          <p className="mt-4 text-muted-foreground">{tSeo("related.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm"><Link href="/calculadoras/alugar-vs-comprar">{tSeo("related.links.rentBuy")}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/calculadoras/financiamento">{tSeo("related.links.financing")}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/calculadoras/financiamento-minha-casa-minha-vida">{tSeo("related.links.mcmv")}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/calculadoras/juros-compostos">{tSeo("related.links.compound")}</Link></Button>
          </div>
        </section>

        <section aria-labelledby="correcao-igpm-disclaimer-seo" className="rounded-lg border bg-muted/20 p-5">
          <h2 id="correcao-igpm-disclaimer-seo" className="text-lg font-semibold">{tSeo("disclaimer.title")}</h2>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground"><p>{tSeo("disclaimer.p1")}</p><p>{tSeo("disclaimer.p2")}</p></div>
        </section>

        <section aria-labelledby="correcao-igpm-faq">
          <h2 id="correcao-igpm-faq" className="text-2xl font-semibold tracking-tight">{tSeo("faq.title")}</h2>
          <div className="mt-4 space-y-4">
            {faqIds.map((id) => (
              <details key={id} className="rounded-lg border p-4">
                <summary className="cursor-pointer font-medium">{tSeo(`faq.items.${id}.question`)}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{tSeo(`faq.items.${id}.answer`)}</p>
              </details>
            ))}
          </div>
          <JsonLd data={faqJsonLd} id="correcao-igpm-faq-jsonld" />
        </section>
      </article>
    </div>
  );
}
