import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { FinanciamentoMinhaCasaMinhaVidaCalculatorClient } from "@/components/calculators/financiamento-minha-casa-minha-vida/financiamento-minha-casa-minha-vida-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";
import { getCalculatorPrimaryCategory } from "@/lib/constants";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6 h-6 w-80 rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="space-y-2">
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-10 w-56 rounded bg-muted" />
      </div>
    </div>
  );
}

export default async function FinanciamentoMinhaCasaMinhaVidaPage() {
  const locale = await getLocale();
  const t = await getTranslations("calculators.financiamento-minha-casa-minha-vida");
  const tCommon = await getTranslations("common");
  const tCategories = await getTranslations("calculatorCategories");
  const tNav = await getTranslations("nav");
  const tSeo = await getTranslations("calculators.financiamento-minha-casa-minha-vida.seo");

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/financiamento-minha-casa-minha-vida");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("financiamento-minha-casa-minha-vida");

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
        <FinanciamentoMinhaCasaMinhaVidaCalculatorClient />
      </Suspense>

      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-usar-mcmv">
          <h2 id="como-usar-mcmv" className="text-2xl font-semibold tracking-tight">
            {tSeo("howToUse.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("howToUse.p1")}</p>
            <p>{tSeo("howToUse.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="faixas-renda-mcmv">
          <h2 id="faixas-renda-mcmv" className="text-2xl font-semibold tracking-tight">
            {tSeo("incomeBands.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("incomeBands.p1")}</p>
            <p>{tSeo("incomeBands.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="taxas-sac-price-mcmv">
          <h2 id="taxas-sac-price-mcmv" className="text-2xl font-semibold tracking-tight">
            {tSeo("ratesAndMethods.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("ratesAndMethods.p1")}</p>
            <p>{tSeo("ratesAndMethods.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="subsidio-mcmv">
          <h2 id="subsidio-mcmv" className="text-2xl font-semibold tracking-tight">
            {tSeo("subsidy.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("subsidy.p1")}</p>
            <p>{tSeo("subsidy.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="limites-imovel-mcmv">
          <h2 id="limites-imovel-mcmv" className="text-2xl font-semibold tracking-tight">
            {tSeo("propertyLimits.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("propertyLimits.p1")}</p>
            <p>{tSeo("propertyLimits.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="proposta-banco-mcmv">
          <h2 id="proposta-banco-mcmv" className="text-2xl font-semibold tracking-tight">
            {tSeo("bankDifferences.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("bankDifferences.p1")}</p>
            <p>{tSeo("bankDifferences.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="fontes-mcmv">
          <h2 id="fontes-mcmv" className="text-2xl font-semibold tracking-tight">
            {tSeo("officialLinks.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("officialLinks.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/habitacao/programa-minha-casa-minha-vida/sobre-o-minha-casa-minha-vida-1"
                target="_blank"
                rel="noreferrer">
                {tSeo("officialLinks.about")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/habitacao/programa-minha-casa-minha-vida/mcmv-fgts"
                target="_blank"
                rel="noreferrer">
                {tSeo("officialLinks.financedLine")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/habitacao/programa-minha-casa-minha-vida/minha-casa-minha-vida-classe-media/minha-casa-minha-vida-classe-media-1"
                target="_blank"
                rel="noreferrer">
                {tSeo("officialLinks.classeMedia")}
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
              <Link href="/calculadoras/alugar-vs-comprar">{tSeo("related.links.alugarVsComprar")}</Link>
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
