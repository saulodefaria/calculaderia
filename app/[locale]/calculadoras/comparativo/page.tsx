import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { ComparativoCalculatorClient } from "@/components/calculators/comparativo/comparativo-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";
import { getCalculatorPrimaryCategory } from "@/lib/constants";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="h-6 w-48 bg-muted rounded mb-6" />
        <div className="space-y-6">
          {/* Valor do Imóvel */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          {/* Financiamento section */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
          {/* Consórcio section */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-10 bg-muted rounded mt-6" />
      </div>
    </div>
  );
}

export default async function ComparativoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.comparativo" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tSeo = await getTranslations({ locale, namespace: "calculators.comparativo.seo" });

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/comparativo");

  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("comparativo");

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

      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("ferramentas"), href: "/ferramentas" },
          { label: tNav("calculadoras"), href: "/calculadoras" },
          { label: tCategories(`${category.id}.title`), href: category.href },
          { label: t("title") },
        ]}
      />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Wrap calculator in Suspense for useSearchParams */}
      <Suspense fallback={<CalculatorSkeleton />}>
        <ComparativoCalculatorClient />
      </Suspense>

      {/* SEO content (static HTML) */}
      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-usar">
          <h2 id="como-usar" className="text-2xl font-semibold tracking-tight">
            {tSeo("howToUse.title")}
          </h2>
          <ol className="mt-4 list-decimal pl-5 space-y-2 text-muted-foreground">
            {(["step1", "step2", "step3", "step4", "step5", "step6"] as const).map((key) => (
              <li key={key}>{tSeo(`howToUse.${key}`)}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="por-que-comparar">
          <h2 id="por-que-comparar" className="text-2xl font-semibold tracking-tight">
            {tSeo("whyCompare.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("whyCompare.p1")}</p>
            <p>{tSeo("whyCompare.p2")}</p>
            <p>{tSeo("whyCompare.p3")}</p>
          </div>
        </section>

        <section aria-labelledby="diferencas-principais">
          <h2 id="diferencas-principais" className="text-2xl font-semibold tracking-tight">
            {tSeo("keyDifferences.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("keyDifferences.intro")}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("keyDifferences.financiamento.title")}</h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
                {(["p1", "p2", "p3", "p4", "p5"] as const).map((key) => (
                  <li key={key}>{tSeo(`keyDifferences.financiamento.${key}`)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("keyDifferences.consorcio.title")}</h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
                {(["p1", "p2", "p3", "p4", "p5"] as const).map((key) => (
                  <li key={key}>{tSeo(`keyDifferences.consorcio.${key}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="custo-total">
          <h2 id="custo-total" className="text-2xl font-semibold tracking-tight">
            {tSeo("totalCost.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("totalCost.intro")}</p>
          <div className="mt-6 rounded-xl border bg-muted/20 p-5">
            <h3 className="text-lg font-semibold">{tSeo("totalCost.formulaTitle")}</h3>
            <div className="mt-3 space-y-2 text-muted-foreground">
              <p>{tSeo("totalCost.financiamentoFormula")}</p>
              <p>{tSeo("totalCost.consorcioFormula")}</p>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{tSeo("totalCost.note")}</p>
          </div>
        </section>

        <section aria-labelledby="investimento-diferenca">
          <h2 id="investimento-diferenca" className="text-2xl font-semibold tracking-tight">
            {tSeo("investmentDifference.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("investmentDifference.intro")}</p>
          <div className="mt-6 rounded-xl border p-5">
            <h3 className="text-lg font-semibold">{tSeo("investmentDifference.exampleTitle")}</h3>
            <p className="mt-2 text-muted-foreground">{tSeo("investmentDifference.example")}</p>
            <p className="mt-4 text-sm text-muted-foreground">{tSeo("investmentDifference.note")}</p>
          </div>
        </section>

        <section aria-labelledby="quando-escolher">
          <h2 id="quando-escolher" className="text-2xl font-semibold tracking-tight">
            {tSeo("whenToChoose.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("whenToChoose.intro")}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-5">
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                {tSeo("whenToChoose.financiamento.title")}
              </h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
                {(["c1", "c2", "c3"] as const).map((key) => (
                  <li key={key}>{tSeo(`whenToChoose.financiamento.${key}`)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 p-5">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {tSeo("whenToChoose.consorcio.title")}
              </h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
                {(["c1", "c2", "c3"] as const).map((key) => (
                  <li key={key}>{tSeo(`whenToChoose.consorcio.${key}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="exemplo">
          <h2 id="exemplo" className="text-2xl font-semibold tracking-tight">
            {tSeo("example.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("example.intro")}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("example.scenarioTitle")}</h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
                {(["s1", "s2", "s3", "s4", "s5"] as const).map((key) => (
                  <li key={key}>{tSeo(`example.${key}`)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("example.whatToLookForTitle")}</h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
                {(["w1", "w2", "w3", "w4"] as const).map((key) => (
                  <li key={key}>{tSeo(`example.${key}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="recursos">
          <h2 id="recursos" className="text-2xl font-semibold tracking-tight">
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
              <Link href="/calculadoras/juros-compostos">{tSeo("related.links.jurosCompostos")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/tir">{tSeo("related.links.tir")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/alugar-vs-comprar">{tSeo("related.links.alugarVsComprar")}</Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="aviso" className="rounded-xl border bg-muted/20 p-5">
          <h2 id="aviso" className="text-lg font-semibold">
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
              <details key={id} className="rounded-xl border p-4">
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
