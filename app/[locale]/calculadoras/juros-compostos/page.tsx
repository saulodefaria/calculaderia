import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { JurosCompostosCalculatorClient } from "@/components/calculators/juros-compostos/juros-compostos-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";
import { getCalculatorPrimaryCategory } from "@/lib/constants";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="h-6 w-48 bg-muted rounded mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="h-10 bg-muted rounded mt-4" />
      </div>
    </div>
  );
}

export default async function JurosCompostosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.juros-compostos" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tSeo = await getTranslations({ locale, namespace: "calculators.juros-compostos.seo" });

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/juros-compostos");

  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("juros-compostos");

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
        <JurosCompostosCalculatorClient />
      </Suspense>

      {/* SEO content (static HTML) */}
      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-usar">
          <h2 id="como-usar" className="text-2xl font-semibold tracking-tight">
            {tSeo("howToUse.title")}
          </h2>
          <ol className="mt-4 list-decimal pl-5 space-y-2 text-muted-foreground">
            {(["step1", "step2", "step3", "step4", "step5"] as const).map((key) => (
              <li key={key}>{tSeo(`howToUse.${key}`)}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="o-que-sao">
          <h2 id="o-que-sao" className="text-2xl font-semibold tracking-tight">
            {tSeo("whatAre.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("whatAre.p1")}</p>
            <p>{tSeo("whatAre.p2")}</p>
            <p>{tSeo("whatAre.p3")}</p>
          </div>
        </section>

        <section aria-labelledby="formula">
          <h2 id="formula" className="text-2xl font-semibold tracking-tight">
            {tSeo("formula.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("formula.intro")}</p>
          <div className="mt-6 rounded-xl border bg-muted/20 p-5">
            <h3 className="text-lg font-semibold">{tSeo("formula.basicTitle")}</h3>
            <p className="mt-2 font-mono text-sm text-muted-foreground">{tSeo("formula.basicFormula")}</p>
            <p className="mt-4 text-sm text-muted-foreground">{tSeo("formula.basicExplanation")}</p>
          </div>
          <div className="mt-6 rounded-xl border bg-muted/20 p-5">
            <h3 className="text-lg font-semibold">{tSeo("formula.withContributionsTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{tSeo("formula.withContributionsExplanation")}</p>
            <p className="mt-4 text-sm text-muted-foreground">{tSeo("formula.withContributionsNote")}</p>
          </div>
        </section>

        <section aria-labelledby="juros-simples-vs-compostos">
          <h2 id="juros-simples-vs-compostos" className="text-2xl font-semibold tracking-tight">
            {tSeo("simpleVsCompound.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("simpleVsCompound.intro")}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("simpleVsCompound.simple.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground font-mono">{tSeo("simpleVsCompound.simple.formula")}</p>
              <p className="mt-3 text-sm text-muted-foreground">{tSeo("simpleVsCompound.simple.explanation")}</p>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("simpleVsCompound.compound.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground font-mono">
                {tSeo("simpleVsCompound.compound.formula")}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{tSeo("simpleVsCompound.compound.explanation")}</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-5">
            <p className="text-sm text-muted-foreground">{tSeo("simpleVsCompound.conclusion")}</p>
          </div>
        </section>

        <section aria-labelledby="regra-72">
          <h2 id="regra-72" className="text-2xl font-semibold tracking-tight">
            {tSeo("rule72.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("rule72.intro")}</p>
          <div className="mt-6 rounded-xl border bg-muted/20 p-5">
            <h3 className="text-lg font-semibold">{tSeo("rule72.formulaTitle")}</h3>
            <p className="mt-2 font-mono text-sm text-muted-foreground">{tSeo("rule72.formula")}</p>
            <p className="mt-4 text-sm text-muted-foreground">{tSeo("rule72.explanation")}</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {(["example1", "example2", "example3"] as const).map((key) => (
                <p key={key}>{tSeo(`rule72.${key}`)}</p>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="aportes-periodicos">
          <h2 id="aportes-periodicos" className="text-2xl font-semibold tracking-tight">
            {tSeo("periodicContributions.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("periodicContributions.intro")}</p>
          <div className="mt-6 rounded-xl border p-5">
            <h3 className="text-lg font-semibold">{tSeo("periodicContributions.benefitsTitle")}</h3>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
              {(["b1", "b2", "b3"] as const).map((key) => (
                <li key={key}>{tSeo(`periodicContributions.${key}`)}</li>
              ))}
            </ul>
          </div>
          <div className="mt-6 rounded-xl border p-5">
            <h3 className="text-lg font-semibold">{tSeo("periodicContributions.exampleTitle")}</h3>
            <p className="mt-2 text-muted-foreground">{tSeo("periodicContributions.example")}</p>
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
              <h3 className="text-lg font-semibold">{tSeo("example.resultTitle")}</h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
                {(["r1", "r2", "r3", "r4"] as const).map((key) => (
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
              <Link href="/calculadoras/comparativo">{tSeo("related.links.comparativo")}</Link>
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
