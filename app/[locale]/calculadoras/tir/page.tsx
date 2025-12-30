import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { TirCalculatorClient } from "@/components/calculators/tir/tir-calculator-client";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="h-6 w-48 bg-muted rounded mb-6" />
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-10 flex-1 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default async function TirPage() {
  const locale = await getLocale();
  const t = await getTranslations("calculators.tir");
  const tCommon = await getTranslations("common");
  const tSeo = await getTranslations("calculators.tir.seo");

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;
  const canonicalPath = locale === "en" ? "/en/calculadoras/tir" : "/calculadoras/tir";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  const breadcrumbHomeName = locale === "en" ? "Home" : "Início";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqIds.map((id) => ({
      "@type": "Question",
      name: tSeo(`faq.items.${id}.question`),
      acceptedAnswer: {
        "@type": "Answer",
        text: tSeo(`faq.items.${id}.answer`),
      },
    })),
  } as const;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: breadcrumbHomeName,
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("title"),
        item: canonicalUrl,
      },
    ],
  } as const;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            {tCommon("backToHome")}
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Wrap calculator in Suspense for useSearchParams */}
      <Suspense fallback={<CalculatorSkeleton />}>
        <TirCalculatorClient />
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

        <section aria-labelledby="o-que-e">
          <h2 id="o-que-e" className="text-2xl font-semibold tracking-tight">
            {tSeo("basics.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("basics.p1")}</p>
            <p>{tSeo("basics.p2")}</p>
            <p>{tSeo("basics.p3")}</p>
          </div>
        </section>

        <section aria-labelledby="como-calcular">
          <h2 id="como-calcular" className="text-2xl font-semibold tracking-tight">
            {tSeo("howToCalculate.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("howToCalculate.intro")}</p>
          <div className="mt-6 rounded-xl border bg-muted/20 p-5">
            <h3 className="text-lg font-semibold">{tSeo("howToCalculate.formulaTitle")}</h3>
            <p className="mt-2 text-muted-foreground font-mono text-sm">{tSeo("howToCalculate.formula")}</p>
            <p className="mt-4 text-sm text-muted-foreground">{tSeo("howToCalculate.explanation")}</p>
          </div>
        </section>

        <section aria-labelledby="fluxos-caixa">
          <h2 id="fluxos-caixa" className="text-2xl font-semibold tracking-tight">
            {tSeo("cashflows.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("cashflows.intro")}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                {tSeo("cashflows.outflows.title")}
              </h3>
              <p className="mt-2 text-muted-foreground">{tSeo("cashflows.outflows.body")}</p>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {(["e1", "e2", "e3"] as const).map((key) => (
                  <li key={key}>{tSeo(`cashflows.outflows.${key}`)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {tSeo("cashflows.inflows.title")}
              </h3>
              <p className="mt-2 text-muted-foreground">{tSeo("cashflows.inflows.body")}</p>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {(["e1", "e2", "e3"] as const).map((key) => (
                  <li key={key}>{tSeo(`cashflows.inflows.${key}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="periodicidade">
          <h2 id="periodicidade" className="text-2xl font-semibold tracking-tight">
            {tSeo("periodicity.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("periodicity.intro")}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(["mensal", "trimestral", "semestral", "anual"] as const).map((periodo) => (
              <div key={periodo} className="rounded-xl border p-4">
                <h3 className="font-semibold">{tSeo(`periodicity.${periodo}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{tSeo(`periodicity.${periodo}.body`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{tSeo("periodicity.note")}</p>
        </section>

        <section aria-labelledby="interpretacao">
          <h2 id="interpretacao" className="text-2xl font-semibold tracking-tight">
            {tSeo("interpretation.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("interpretation.intro")}</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-5">
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                {tSeo("interpretation.positive.title")}
              </h3>
              <p className="mt-2 text-muted-foreground">{tSeo("interpretation.positive.body")}</p>
            </div>
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 p-5">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                {tSeo("interpretation.negative.title")}
              </h3>
              <p className="mt-2 text-muted-foreground">{tSeo("interpretation.negative.body")}</p>
            </div>
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 p-5">
              <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                {tSeo("interpretation.zero.title")}
              </h3>
              <p className="mt-2 text-muted-foreground">{tSeo("interpretation.zero.body")}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="exemplo">
          <h2 id="exemplo" className="text-2xl font-semibold tracking-tight">
            {tSeo("example.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("example.intro")}</p>
          <div className="mt-6 rounded-xl border bg-muted/20 p-5">
            <h3 className="text-lg font-semibold">{tSeo("example.scenarioTitle")}</h3>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
              {(["s1", "s2", "s3", "s4", "s5"] as const).map((key) => (
                <li key={key}>{tSeo(`example.${key}`)}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-medium">{tSeo("example.result")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{tSeo("example.analysis")}</p>
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

          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        </section>
      </article>
    </div>
  );
}
