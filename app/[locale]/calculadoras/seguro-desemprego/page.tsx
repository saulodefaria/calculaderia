import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { SeguroDesempregoCalculatorClient } from "@/components/calculators/seguro-desemprego/seguro-desemprego-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";
import { getCalculatorPrimaryCategory } from "@/lib/constants";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6 h-6 w-64 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
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

export default async function SeguroDesempregoPage() {
  const locale = await getLocale();
  const t = await getTranslations("calculators.seguro-desemprego");
  const tCommon = await getTranslations("common");
  const tCategories = await getTranslations("calculatorCategories");
  const tNav = await getTranslations("nav");
  const tSeo = await getTranslations("calculators.seguro-desemprego.seo");

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/seguro-desemprego");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("seguro-desemprego");

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
        <SeguroDesempregoCalculatorClient />
      </Suspense>

      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-calcular-seguro-desemprego">
          <h2 id="como-calcular-seguro-desemprego" className="text-2xl font-semibold tracking-tight">
            {tSeo("howToCalculate.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("howToCalculate.p1")}</p>
            <p>{tSeo("howToCalculate.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="tabela-seguro-desemprego-2026">
          <h2 id="tabela-seguro-desemprego-2026" className="text-2xl font-semibold tracking-tight">
            {tSeo("table2026.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("table2026.p1")}</p>
            <p>{tSeo("table2026.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="parcelas-seguro-desemprego">
          <h2 id="parcelas-seguro-desemprego" className="text-2xl font-semibold tracking-tight">
            {tSeo("parcelCount.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("parcelCount.p1")}</p>
            <p>{tSeo("parcelCount.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="direito-seguro-desemprego-formal">
          <h2 id="direito-seguro-desemprego-formal" className="text-2xl font-semibold tracking-tight">
            {tSeo("eligibility.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("eligibility.p1")}</p>
            <p>{tSeo("eligibility.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="resultado-oficial-diferente">
          <h2 id="resultado-oficial-diferente" className="text-2xl font-semibold tracking-tight">
            {tSeo("officialDifference.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("officialDifference.text")}</p>
        </section>

        <section aria-labelledby="quando-solicitar">
          <h2 id="quando-solicitar" className="text-2xl font-semibold tracking-tight">
            {tSeo("requestWhen.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("requestWhen.text")}</p>
        </section>

        <section aria-labelledby="fontes-oficiais">
          <h2 id="fontes-oficiais" className="text-2xl font-semibold tracking-tight">
            {tSeo("officialLinks.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("officialLinks.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a href="https://www.gov.br/pt-br/servicos/solicitar-o-seguro-desemprego" target="_blank" rel="noreferrer">
                {tSeo("officialLinks.govbr")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2026/janeiro/mte-reajusta-valores-do-beneficio-seguro-desemprego"
                target="_blank"
                rel="noreferrer">
                {tSeo("officialLinks.mte2026")}
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
              <Link href="/calculadoras/rescisao-trabalhista">{tSeo("related.links.rescisao")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/ferias">{tSeo("related.links.ferias")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/juros-compostos">{tSeo("related.links.jurosCompostos")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/renda-fixa">{tSeo("related.links.rendaFixa")}</Link>
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
          <JsonLd data={faqJsonLd} />
        </section>
      </article>
    </div>
  );
}
