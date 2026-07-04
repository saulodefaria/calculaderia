import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { InvestimentoCalculatorClient } from "@/components/calculators/investimento/investimento-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { getCalculatorPrimaryCategory } from "@/lib/constants";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6 h-6 w-72 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-10 w-48 rounded bg-muted" />
      </div>
    </div>
  );
}

export default async function InvestimentoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.investimento" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tSeo = await getTranslations({ locale, namespace: "calculators.investimento.seo" });

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/investimento");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("investimento");

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
        <InvestimentoCalculatorClient />
      </Suspense>

      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-funciona-investimento">
          <h2 id="como-funciona-investimento" className="text-2xl font-semibold tracking-tight">
            {tSeo("howItWorks.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("howItWorks.p1")}</p>
            <p>{tSeo("howItWorks.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="projecao-meta-investimento">
          <h2 id="projecao-meta-investimento" className="text-2xl font-semibold tracking-tight">
            {tSeo("projectionVsGoal.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("projectionVsGoal.p1")}</p>
            <p>{tSeo("projectionVsGoal.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="taxa-anual-mensal">
          <h2 id="taxa-anual-mensal" className="text-2xl font-semibold tracking-tight">
            {tSeo("rates.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("rates.text")}</p>
        </section>

        <section aria-labelledby="nao-inclui-investimento">
          <h2 id="nao-inclui-investimento" className="text-2xl font-semibold tracking-tight">
            {tSeo("exclusions.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("exclusions.text")}</p>
        </section>

        <section aria-labelledby="fontes-investimento">
          <h2 id="fontes-investimento" className="text-2xl font-semibold tracking-tight">
            {tSeo("sources.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("sources.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a
                href="https://support.microsoft.com/en-us/office/fv-function-2eef9f44-a084-4c61-bdd8-4fe4bb1b71b3"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.fv")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://support.microsoft.com/en-us/office/pmt-function-0214da64-9a63-4996-bc20-214433fa6441"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.pmt")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://support.microsoft.com/en-us/office/nper-function-240535b5-6653-4d2d-bfcf-b6a38151d815"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.nper")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://support.microsoft.com/en-us/office/effect-function-910d4e4c-79e2-4009-95e6-507e04f11bc4"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.effect")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="https://www.bcb.gov.br/meubc/calculadoradocidadao" target="_blank" rel="noreferrer">
                {tSeo("sources.bcb")}
              </a>
            </Button>
          </div>
        </section>

        <section aria-labelledby="relacionadas-investimento">
          <h2 id="relacionadas-investimento" className="text-2xl font-semibold tracking-tight">
            {tSeo("related.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("related.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/juros-compostos">{tSeo("related.links.jurosCompostos")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/renda-fixa">{tSeo("related.links.rendaFixa")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/tir">{tSeo("related.links.tir")}</Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="aviso-investimento" className="rounded-lg border bg-muted/20 p-5">
          <h2 id="aviso-investimento" className="text-lg font-semibold">
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
