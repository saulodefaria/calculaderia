import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RescisaoSemFgtsCalculatorClient } from "@/components/calculators/rescisao-sem-fgts/rescisao-sem-fgts-calculator-client";
import { JsonLd } from "@/components/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { getCalculatorPrimaryCategory } from "@/lib/constants";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6 h-6 w-64 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
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

export default async function RescisaoSemFgtsPage() {
  const locale = await getLocale();
  const t = await getTranslations("calculators.rescisao-sem-fgts");
  const tCommon = await getTranslations("common");
  const tCategories = await getTranslations("calculatorCategories");
  const tNav = await getTranslations("nav");
  const tSeo = await getTranslations("calculators.rescisao-sem-fgts.seo");

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] as const;
  const canonicalPath = getLocalizedPathname(locale, "/calculadoras/rescisao-sem-fgts");
  const canonicalUrl = absoluteUrl(canonicalPath);
  const category = getCalculatorPrimaryCategory("rescisao-sem-fgts");

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
        <RescisaoSemFgtsCalculatorClient />
      </Suspense>

      <article className="mt-12 space-y-10">
        <section aria-labelledby="o-que-e-rescisao-sem-fgts">
          <h2 id="o-que-e-rescisao-sem-fgts" className="text-2xl font-semibold tracking-tight">
            {tSeo("meaning.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("meaning.p1")}</p>
            <p>{tSeo("meaning.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="pedido-demissao-sem-fgts">
          <h2 id="pedido-demissao-sem-fgts" className="text-2xl font-semibold tracking-tight">
            {tSeo("resignation.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("resignation.intro")}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            {(["b1", "b2", "b3"] as const).map((key) => (
              <li key={key}>{tSeo(`resignation.${key}`)}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="justa-causa-sem-fgts">
          <h2 id="justa-causa-sem-fgts" className="text-2xl font-semibold tracking-tight">
            {tSeo("withCause.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("withCause.p1")}</p>
            <p>{tSeo("withCause.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="aviso-previo-descontado">
          <h2 id="aviso-previo-descontado" className="text-2xl font-semibold tracking-tight">
            {tSeo("notice.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("notice.p1")}</p>
            <p>{tSeo("notice.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="porque-fgts-zerado">
          <h2 id="porque-fgts-zerado" className="text-2xl font-semibold tracking-tight">
            {tSeo("fgtsZero.title")}
          </h2>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>{tSeo("fgtsZero.p1")}</p>
            <p>{tSeo("fgtsZero.p2")}</p>
          </div>
        </section>

        <section aria-labelledby="quando-usar-completa">
          <h2 id="quando-usar-completa" className="text-2xl font-semibold tracking-tight">
            {tSeo("fullCalculator.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("fullCalculator.text")}</p>
        </section>

        <section aria-labelledby="fontes-oficiais">
          <h2 id="fontes-oficiais" className="text-2xl font-semibold tracking-tight">
            {tSeo("sources.title")}
          </h2>
          <p className="mt-4 text-muted-foreground">{tSeo("sources.intro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/trabalho-e-emprego/pt-br/servicos/trabalhador/fgts/fundo-de-garantia-do-tempo-de-servico-fgts"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.links.fgts")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital/comunicados/informando-o-valor-base-para-fins-rescisorios-no-fgts-digital/"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.links.fgtsDigital")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.links.inss")}
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026"
                target="_blank"
                rel="noreferrer">
                {tSeo("sources.links.receita")}
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
              <Link href="/calculadoras/fgts">{tSeo("related.links.fgts")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/salario-liquido">{tSeo("related.links.salarioLiquido")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/ferias">{tSeo("related.links.ferias")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/decimo-terceiro">{tSeo("related.links.decimoTerceiro")}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/calculadoras/seguro-desemprego">{tSeo("related.links.seguroDesemprego")}</Link>
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
