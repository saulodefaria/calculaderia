import { Suspense } from "react";
import { ToolMessagesProvider } from "@/components/i18n/tool-messages-provider";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CdbCalculatorClient } from "@/components/calculators/cdb/cdb-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";
import { getCalculatorPrimaryCategory } from "@/lib/constants";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6 h-6 w-48 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-10 rounded bg-muted" />
      </div>
    </div>
  );
}

export default async function CdbPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.cdb" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tSeo = await getTranslations({ locale, namespace: "calculators.cdb.seo" });

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/cdb");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("cdb");

  const faqJsonLd = createFaqJsonLd(
    faqIds.map((id) => ({
      question: tSeo(`faq.items.${id}.question`),
      answer: tSeo(`faq.items.${id}.answer`),
    }))
  );

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
      item: absoluteUrl(getLocalizedPathname(locale, category.href)),
    },
    {
      name: t("title"),
      item: canonicalUrl,
    },
  ]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd} />

      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("ferramentas"), href: "/ferramentas" },
          { label: tNav("calculadoras"), href: "/calculadoras" },
          { label: tCategories(`${category.id}.title`), href: category.href },
          { label: t("title") },
        ]}
      />

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Suspense fallback={<CalculatorSkeleton />}>
        <ToolMessagesProvider locale={locale} toolId="cdb">
          <CdbCalculatorClient />
        </ToolMessagesProvider>
      </Suspense>

      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-calcular-cdb">
          <h2 id="como-calcular-cdb" className="text-2xl font-semibold tracking-tight">
            {tSeo("howToCalculate.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("howToCalculate.p1")}</p>
            <p>{tSeo("howToCalculate.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="cdb-prefixado-cdi">
          <h2 id="cdb-prefixado-cdi" className="text-2xl font-semibold tracking-tight">
            {tSeo("preVsCdi.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("preVsCdi.p1")}</p>
            <p>{tSeo("preVsCdi.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="ir-iof-cdb">
          <h2 id="ir-iof-cdb" className="text-2xl font-semibold tracking-tight">
            {tSeo("taxes.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("taxes.p1")}</p>
            <p>{tSeo("taxes.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="cem-porcento-cdi">
          <h2 id="cem-porcento-cdi" className="text-2xl font-semibold tracking-tight">
            {tSeo("oneHundredCdi.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("oneHundredCdi.text")}</p>
        </section>

        <section aria-labelledby="fgc-cdb">
          <h2 id="fgc-cdb" className="text-2xl font-semibold tracking-tight">
            {tSeo("fgc.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("fgc.text")}</p>
        </section>

        <section aria-labelledby="fontes-cdb">
          <h2 id="fontes-cdb" className="text-2xl font-semibold tracking-tight">
            {tSeo("sources.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("sources.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.ir")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/decreto/d6306.htm"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.iof")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://www.bcb.gov.br/estatisticas/sgs" target="_blank" rel="noreferrer">
                {tSeo("sources.bcb")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://www.fgc.org.br/sobre-garantia-fgc" target="_blank" rel="noreferrer">
                {tSeo("sources.fgc")}
              </a>
            </Button>
          </div>
        </section>

        <section aria-labelledby="relacionadas-cdb">
          <h2 id="relacionadas-cdb" className="text-2xl font-semibold tracking-tight">
            {tSeo("related.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("related.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/renda-fixa">{tSeo("related.links.rendaFixa")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/juros-compostos">{tSeo("related.links.jurosCompostos")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/tir">{tSeo("related.links.tir")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/guias/renda-fixa-cdi-ipca-selic">{tSeo("related.links.guia")}</Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="aviso-cdb" className="rounded-lg border bg-muted/20 p-5">
          <h2 id="aviso-cdb" className="text-lg font-semibold">
            {tSeo("disclaimer.title")}
          </h2>
          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            <p>{tSeo("disclaimer.p1")}</p>
            <p>{tSeo("disclaimer.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="faq">
          <h2 id="faq" className="text-2xl font-semibold tracking-tight">
            {tSeo("faq.title")}
          </h2>
          <div className="mt-4 space-y-4">
            {faqIds.map((id) => (
              <details key={id} className="rounded-lg border p-4">
                <summary className="cursor-pointer font-medium">{tSeo(`faq.items.${id}.question`)}</summary>
                <div className="mt-3 text-sm text-muted-foreground">{tSeo(`faq.items.${id}.answer`)}</div>
              </details>
            ))}
          </div>
          <JsonLd data={faqJsonLd} />
        </section>
      </article>
    </div>
  );
}
