import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FinanciamentoCalculatorClient } from "@/components/calculators/financiamento/financiamento-calculator-client";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="h-6 w-48 bg-muted rounded mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
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

export default async function FinanciamentoPage() {
  const locale = await getLocale();
  const t = await getTranslations("calculators.financiamento");
  const tCommon = await getTranslations("common");
  const tSeo = await getTranslations("calculators.financiamento.seo");

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;
  const canonicalPath = locale === "en" ? "/en/calculadoras/financiamento" : "/calculadoras/financiamento";

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
        <FinanciamentoCalculatorClient />
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
          </div>
        </section>

        <section aria-labelledby="sac-vs-price">
          <h2 id="sac-vs-price" className="text-2xl font-semibold tracking-tight">
            {tSeo("sacVsPrice.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("sacVsPrice.intro")}</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("sacVsPrice.sac.title")}</h3>
              <p className="mt-2 text-muted-foreground">{tSeo("sacVsPrice.sac.body")}</p>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("sacVsPrice.price.title")}</h3>
              <p className="mt-2 text-muted-foreground">{tSeo("sacVsPrice.price.body")}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{tSeo("sacVsPrice.tip")}</p>
        </section>

        <section aria-labelledby="tabela-amortizacao">
          <h2 id="tabela-amortizacao" className="text-2xl font-semibold tracking-tight">
            {tSeo("amortizationTable.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("amortizationTable.intro")}</p>
          <ul className="mt-4 list-disc pl-5 space-y-2 text-muted-foreground">
            {(["b1", "b2", "b3", "b4", "b5"] as const).map((key) => (
              <li key={key}>{tSeo(`amortizationTable.${key}`)}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="amortizacao-extra">
          <h2 id="amortizacao-extra" className="text-2xl font-semibold tracking-tight">
            {tSeo("extraAmortization.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("extraAmortization.intro")}</p>
            <div className="rounded-xl border bg-muted/20 p-5">
              <h3 className="text-lg font-semibold text-foreground">{tSeo("extraAmortization.modesTitle")}</h3>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li>{tSeo("extraAmortization.prazo")}</li>
                <li>{tSeo("extraAmortization.parcela")}</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">{tSeo("extraAmortization.note")}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="exemplo">
          <h2 id="exemplo" className="text-2xl font-semibold tracking-tight">
            {tSeo("example.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("example.intro")}</p>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("example.assumptionsTitle")}</h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
                {(["a1", "a2", "a3", "a4"] as const).map((key) => (
                  <li key={key}>{tSeo(`example.${key}`)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border p-5">
              <h3 className="text-lg font-semibold">{tSeo("example.whatToLookForTitle")}</h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-muted-foreground">
                {(["w1", "w2", "w3"] as const).map((key) => (
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
              <Link href="/calculadoras/juros-compostos">{tSeo("related.links.jurosCompostos")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/tir">{tSeo("related.links.tir")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/alugar-vs-comprar">{tSeo("related.links.alugarVsComprar")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/consorcio">{tSeo("related.links.consorcio")}</Link>
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
