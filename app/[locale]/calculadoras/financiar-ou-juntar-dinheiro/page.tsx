import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FinanciarOuJuntarDinheiroCalculatorClient } from "@/components/calculators/financiar-ou-juntar-dinheiro/financiar-ou-juntar-dinheiro-calculator-client";
import { ToolMessagesProvider } from "@/components/i18n/tool-messages-provider";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { getCalculatorPrimaryCategory } from "@/lib/constants";
import {
  absoluteUrl,
  createBreadcrumbJsonLd,
  createFaqJsonLd,
  createSoftwareApplicationJsonLd,
} from "@/lib/seo";

function CalculatorSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6 h-6 w-56 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function FinanciarOuJuntarDinheiroPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.financiar-ou-juntar-dinheiro" });
  const tSeo = await getTranslations({ locale, namespace: "calculators.financiar-ou-juntar-dinheiro.seo" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCategories = await getTranslations({ locale, namespace: "calculatorCategories" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/financiar-ou-juntar-dinheiro");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("financiar-ou-juntar-dinheiro");
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: tCommon("home"), item: absoluteUrl(getLocalizedPathname(locale, "/")) },
    { name: tNav("ferramentas"), item: absoluteUrl(getLocalizedPathname(locale, "/ferramentas")) },
    { name: tNav("calculadoras"), item: absoluteUrl(getLocalizedPathname(locale, "/calculadoras")) },
    { name: tCategories(`${category.id}.title`), item: absoluteUrl(getLocalizedPathname(locale, category.href)) },
    { name: t("title"), item: canonicalUrl },
  ]);
  const faqJsonLd = createFaqJsonLd(
    faqIds.map((id) => ({ question: tSeo(`faq.items.${id}.question`), answer: tSeo(`faq.items.${id}.answer`) }))
  );
  const appJsonLd = createSoftwareApplicationJsonLd({
    name: t("title"),
    url: canonicalUrl,
    description: t("description"),
    applicationCategory: "FinanceApplication",
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={[breadcrumbJsonLd, appJsonLd]} />
      <Breadcrumbs
        items={[
          { label: tCommon("home"), href: "/" },
          { label: tNav("ferramentas"), href: "/ferramentas" },
          { label: tNav("calculadoras"), href: "/calculadoras" },
          { label: tCategories(`${category.id}.title`), href: category.href },
          { label: t("title") },
        ]}
      />

      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </header>

      <Suspense fallback={<CalculatorSkeleton />}>
        <ToolMessagesProvider locale={locale} toolId="financiar-ou-juntar-dinheiro">
          <FinanciarOuJuntarDinheiroCalculatorClient />
        </ToolMessagesProvider>
      </Suspense>

      <article className="mt-12 space-y-10">
        <section aria-labelledby="como-funciona-financiar-juntar">
          <h2 id="como-funciona-financiar-juntar" className="text-2xl font-semibold tracking-tight">
            {tSeo("howItWorks.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("howItWorks.p1")}</p>
            <p>{tSeo("howItWorks.p2")}</p>
            <p>{tSeo("howItWorks.p3")}</p>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          {(["sacPrice", "rent", "horizon"] as const).map((section) => (
            <section key={section} className="rounded-xl border p-5">
              <h2 className="text-lg font-semibold">{tSeo(`${section}.title`)}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{tSeo(`${section}.text`)}</p>
            </section>
          ))}
        </div>

        <section aria-labelledby="metodologia-financiar-juntar">
          <h2 id="metodologia-financiar-juntar" className="text-2xl font-semibold tracking-tight">
            {tSeo("methodology.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("methodology.timing")}</p>
            <p>{tSeo("methodology.never")}</p>
            <p>{tSeo("methodology.limits")}</p>
          </div>
        </section>

        <section aria-labelledby="fontes-financiar-juntar">
          <h2 id="fontes-financiar-juntar" className="text-2xl font-semibold tracking-tight">
            {tSeo("sources.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("sources.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm"><a href="https://www.bcb.gov.br/cidadaniafinanceira" target="_blank" rel="noreferrer">{tSeo("sources.bcb")}</a></Button>
            <Button asChild variant="outline" size="sm"><a href="https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator" target="_blank" rel="noreferrer">{tSeo("sources.investor")}</a></Button>
            <Button asChild variant="outline" size="sm"><a href="https://support.microsoft.com/en-us/office/fv-function-2eef9f44-a084-4c61-bdd8-4fe4bb1b71b3" target="_blank" rel="noreferrer">{tSeo("sources.fv")}</a></Button>
            <Button asChild variant="outline" size="sm"><a href="https://support.microsoft.com/en-us/office/pmt-function-0214da64-9a63-4996-bc20-214433fa6441" target="_blank" rel="noreferrer">{tSeo("sources.pmt")}</a></Button>
            <Button asChild variant="outline" size="sm"><a href="https://www.consumerfinance.gov/owning-a-home/loan-options/" target="_blank" rel="noreferrer">{tSeo("sources.cfpb")}</a></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{tSeo("sources.accessed")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{tSeo("sources.limits")}</p>
        </section>

        <section aria-labelledby="privacidade-financiar-juntar" className="rounded-xl border bg-muted/20 p-5">
          <h2 id="privacidade-financiar-juntar" className="text-lg font-semibold">{tSeo("privacy.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tSeo("privacy.text")}</p>
        </section>

        <section aria-labelledby="relacionadas-financiar-juntar">
          <h2 id="relacionadas-financiar-juntar" className="text-2xl font-semibold tracking-tight">
            {tSeo("related.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("related.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm"><Link href="/calculadoras/financiamento">{tSeo("related.links.financiamento")}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/calculadoras/alugar-vs-comprar">{tSeo("related.links.alugarComprar")}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/calculadoras/juros-compostos">{tSeo("related.links.jurosCompostos")}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/calculadoras/investimento">{tSeo("related.links.investimento")}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/calculadoras/renda-fixa">{tSeo("related.links.rendaFixa")}</Link></Button>
          </div>
        </section>

        <section aria-labelledby="aviso-financiar-juntar" className="rounded-xl border bg-muted/20 p-5">
          <h2 id="aviso-financiar-juntar" className="text-lg font-semibold">{tSeo("disclaimer.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tSeo("disclaimer.text")}</p>
        </section>

        <section aria-labelledby="faq-financiar-juntar">
          <h2 id="faq-financiar-juntar" className="text-2xl font-semibold tracking-tight">{tSeo("faq.title")}</h2>
          <div className="mt-4 space-y-4">
            {faqIds.map((id) => (
              <details key={id} className="rounded-xl border p-4">
                <summary className="cursor-pointer font-medium">{tSeo(`faq.items.${id}.question`)}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{tSeo(`faq.items.${id}.answer`)}</p>
              </details>
            ))}
          </div>
          <JsonLd data={faqJsonLd} />
        </section>
      </article>
    </div>
  );
}
