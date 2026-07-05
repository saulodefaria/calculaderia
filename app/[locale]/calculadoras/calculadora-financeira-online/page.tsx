import { Suspense } from "react";
import { ToolMessagesProvider } from "@/components/i18n/tool-messages-provider";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { CalculadoraFinanceiraOnlineCalculatorClient } from "@/components/calculators/calculadora-financeira-online/calculadora-financeira-online-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";
import { getCalculatorPrimaryCategory } from "@/lib/constants";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6 h-6 w-64 rounded bg-muted" />
        <div className="mb-6 h-9 w-full rounded bg-muted" />
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

export default async function CalculadoraFinanceiraOnlinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.calculadora-financeira-online" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tSeo = await getTranslations({ locale, namespace: "calculators.calculadora-financeira-online.seo" });

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/calculadora-financeira-online");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("calculadora-financeira-online");

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
        <ToolMessagesProvider locale={locale} toolId="calculadora-financeira-online">
          <CalculadoraFinanceiraOnlineCalculatorClient />
        </ToolMessagesProvider>
      </Suspense>

      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-usar-calculadora-financeira">
          <h2 id="como-usar-calculadora-financeira" className="text-2xl font-semibold tracking-tight">
            {tSeo("howToUse.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("howToUse.p1")}</p>
            <p>{tSeo("howToUse.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="variaveis-tvm">
          <h2 id="variaveis-tvm" className="text-2xl font-semibold tracking-tight">
            {tSeo("tvmVariables.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("tvmVariables.text")}</p>
        </section>

        <section aria-labelledby="sinais-tvm">
          <h2 id="sinais-tvm" className="text-2xl font-semibold tracking-tight">
            {tSeo("signs.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("signs.text")}</p>
        </section>

        <section aria-labelledby="vpl-tir">
          <h2 id="vpl-tir" className="text-2xl font-semibold tracking-tight">
            {tSeo("npvIrr.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("npvIrr.text")}</p>
        </section>

        <section aria-labelledby="calculadora-generica">
          <h2 id="calculadora-generica" className="text-2xl font-semibold tracking-tight">
            {tSeo("generic.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("generic.text")}</p>
        </section>

        <section aria-labelledby="fontes-formulas">
          <h2 id="fontes-formulas" className="text-2xl font-semibold tracking-tight">
            {tSeo("sources.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("sources.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a href="https://support.microsoft.com/en-us/excel/functions/pmt-function" target="_blank" rel="noreferrer">
                {tSeo("sources.pmt")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://support.microsoft.com/en-us/excel/functions/npv-function" target="_blank" rel="noreferrer">
                {tSeo("sources.npv")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://support.microsoft.com/en-us/excel/functions/irr-function" target="_blank" rel="noreferrer">
                {tSeo("sources.irr")}
              </a>
            </Button>
          </div>
        </section>

        <section aria-labelledby="relacionadas">
          <h2 id="relacionadas" className="text-2xl font-semibold tracking-tight">
            {tSeo("related.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("related.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/tir">{tSeo("related.links.tir")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/juros-compostos">{tSeo("related.links.jurosCompostos")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/financiamento">{tSeo("related.links.financiamento")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/renda-fixa">{tSeo("related.links.rendaFixa")}</Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="aviso-legal" className="rounded-lg border bg-muted/20 p-5">
          <h2 id="aviso-legal" className="text-lg font-semibold">
            {tSeo("disclaimer.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{tSeo("disclaimer.text")}</p>
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
