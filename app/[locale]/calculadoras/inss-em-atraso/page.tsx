import { Suspense } from "react";
import { ToolMessagesProvider } from "@/components/i18n/tool-messages-provider";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { InssEmAtrasoCalculatorClient } from "@/components/calculators/inss-em-atraso/inss-em-atraso-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";
import { getCalculatorPrimaryCategory } from "@/lib/constants";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6 h-6 w-80 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
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

export default async function InssEmAtrasoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.inss-em-atraso" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tSeo = await getTranslations({ locale, namespace: "calculators.inss-em-atraso.seo" });

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/inss-em-atraso");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("inss-em-atraso");

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
      <JsonLd data={faqJsonLd} />

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
        <ToolMessagesProvider locale={locale} toolId="inss-em-atraso">
          <InssEmAtrasoCalculatorClient />
        </ToolMessagesProvider>
      </Suspense>

      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-calcular-inss-em-atraso">
          <h2 id="como-calcular-inss-em-atraso" className="text-2xl font-semibold tracking-tight">
            {tSeo("howToCalculate.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("howToCalculate.p1")}</p>
            <p>{tSeo("howToCalculate.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="autoatendimento-inss">
          <h2 id="autoatendimento-inss" className="text-2xl font-semibold tracking-tight">
            {tSeo("selfService.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("selfService.p1")}</p>
            <p>{tSeo("selfService.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="selic-multa">
          <h2 id="selic-multa" className="text-2xl font-semibold tracking-tight">
            {tSeo("selicPenalty.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("selicPenalty.p1")}</p>
            <p>{tSeo("selicPenalty.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="valor-oficial-diferente">
          <h2 id="valor-oficial-diferente" className="text-2xl font-semibold tracking-tight">
            {tSeo("officialDifference.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("officialDifference.text")}</p>
        </section>

        <section aria-labelledby="fora-da-calculadora">
          <h2 id="fora-da-calculadora" className="text-2xl font-semibold tracking-tight">
            {tSeo("notIncluded.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("notIncluded.p1")}</p>
            <p>{tSeo("notIncluded.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="fontes-oficiais">
          <h2 id="fontes-oficiais" className="text-2xl font-semibold tracking-tight">
            {tSeo("officialLinks.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("officialLinks.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/calculo-da-guia-da-previdencia-social-gps"
                target="_blank"
                rel="noreferrer">
                {tSeo("officialLinks.gps")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/regularizacao-de-contribuicao-previdenciaria"
                target="_blank"
                rel="noreferrer">
                {tSeo("officialLinks.regularization")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/pagamentos-e-parcelamentos/pagamento-em-atraso/o-que-sao-os-acrescimos-legais"
                target="_blank"
                rel="noreferrer">
                {tSeo("officialLinks.legalAdditions")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://sicalc.receita.fazenda.gov.br/sicalc/selic/consulta"
                target="_blank"
                rel="noreferrer">
                {tSeo("officialLinks.selic")}
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
              <Link href="/calculadoras/inss">{tSeo("related.links.inss")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/salario-liquido">{tSeo("related.links.salarioLiquido")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/salario-pj">{tSeo("related.links.salarioPj")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/imposto-de-renda">{tSeo("related.links.impostoDeRenda")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/fgts">{tSeo("related.links.fgts")}</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{tSeo("related.future")}</p>
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
        </section>
      </article>
    </div>
  );
}
