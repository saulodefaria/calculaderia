import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { FinanciamentoVeiculoCalculatorClient } from "@/components/calculators/financiamento-veiculo/financiamento-veiculo-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";
import { getCalculatorPrimaryCategory } from "@/lib/constants";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6 h-6 w-72 rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-10 w-52 rounded bg-muted" />
      </div>
    </div>
  );
}

export default async function FinanciamentoVeiculoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.financiamento-veiculo" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tSeo = await getTranslations({ locale, namespace: "calculators.financiamento-veiculo.seo" });

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/financiamento-veiculo");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("financiamento-veiculo");

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
        <FinanciamentoVeiculoCalculatorClient />
      </Suspense>

      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-usar-simulador-veiculo">
          <h2 id="como-usar-simulador-veiculo" className="text-2xl font-semibold tracking-tight">
            {tSeo("howToUse.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("howToUse.p1")}</p>
            <p>{tSeo("howToUse.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="price-sac-veiculo">
          <h2 id="price-sac-veiculo" className="text-2xl font-semibold tracking-tight">
            {tSeo("priceVsSac.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("priceVsSac.p1")}</p>
            <p>{tSeo("priceVsSac.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="entrada-prazo-juros-veiculo">
          <h2 id="entrada-prazo-juros-veiculo" className="text-2xl font-semibold tracking-tight">
            {tSeo("entryAndTerm.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("entryAndTerm.text")}</p>
        </section>

        <section aria-labelledby="cet-proposta-veiculo">
          <h2 id="cet-proposta-veiculo" className="text-2xl font-semibold tracking-tight">
            {tSeo("cet.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("cet.p1")}</p>
            <p>{tSeo("cet.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="cenarios-veiculo">
          <h2 id="cenarios-veiculo" className="text-2xl font-semibold tracking-tight">
            {tSeo("examples.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("examples.p1")}</p>
            <p>{tSeo("examples.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="fontes-financiamento-veiculo">
          <h2 id="fontes-financiamento-veiculo" className="text-2xl font-semibold tracking-tight">
            {tSeo("officialLinks.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("officialLinks.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a href="https://support.microsoft.com/en-us/excel/functions/pmt-function" target="_blank" rel="noreferrer">
                {tSeo("officialLinks.pmt")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://support.microsoft.com/en-us/excel/functions/ipmt-function" target="_blank" rel="noreferrer">
                {tSeo("officialLinks.ipmt")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://support.microsoft.com/en-us/excel/functions/ppmt-function" target="_blank" rel="noreferrer">
                {tSeo("officialLinks.ppmt")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://www.bcb.gov.br/meubc/calculadoradocidadao" target="_blank" rel="noreferrer">
                {tSeo("officialLinks.bcbCalculator")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://www.bcb.gov.br/estatisticas/txjuros" target="_blank" rel="noreferrer">
                {tSeo("officialLinks.bcbRates")}
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
              <Link href="/calculadoras/financiamento">{tSeo("related.links.financiamento")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/consorcio">{tSeo("related.links.consorcio")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/comparativo">{tSeo("related.links.comparativo")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/juros-compostos">{tSeo("related.links.jurosCompostos")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/tir">{tSeo("related.links.tir")}</Link>
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
