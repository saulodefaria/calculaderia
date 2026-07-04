import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, createBreadcrumbJsonLd, createFaqJsonLd } from "@/lib/seo";
import { getLocalizedPathname } from "@/i18n/paths";
import { getGuideBySlug } from "@/lib/guides";
import { calculators } from "@/lib/constants";

// Guide content components
import {
  SacVsPriceContent,
  JurosCompostosContent,
  TirContent,
  RendaFixaContent,
  FinanciamentoVsConsorcioContent,
  ComoUsarContent,
} from "@/components/guides";

const guideContentMap: Record<string, React.ComponentType<{ t: (key: string) => string }>> = {
  "sac-vs-price": SacVsPriceContent,
  "juros-compostos-como-calcular": JurosCompostosContent,
  "tir-o-que-e-como-calcular": TirContent,
  "renda-fixa-cdi-ipca-selic": RendaFixaContent,
  "financiamento-vs-consorcio": FinanciamentoVsConsorcioContent,
  "como-usar-calculadora-financeira": ComoUsarContent,
};

export default async function GuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "guides" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tCalculators = await getTranslations({ locale, namespace: "calculators" });

  // Get the guide-specific translation function
  const guideKey = guide.titleKey.replace("guides.", "").split(".")[0]; // e.g., "sacVsPrice"
  const guideT = (key: string) => t(`${guideKey}.${key}`);

  const canonicalPath = getLocalizedPathname(locale, `/guias/${slug}`);
  const canonicalUrl = absoluteUrl(canonicalPath);

  // FAQ data
  const faqItems = Array.from({ length: guide.faqCount }, (_, i) => ({
    question: t(`${guideKey}.faq.q${i + 1}.question`),
    answer: t(`${guideKey}.faq.q${i + 1}.answer`),
  }));

  const faqJsonLd = createFaqJsonLd(faqItems);

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    {
      name: tCommon("home"),
      item: absoluteUrl(getLocalizedPathname(locale, "/")),
    },
    {
      name: t("index.title"),
      item: absoluteUrl(getLocalizedPathname(locale, "/guias")),
    },
    {
      name: t(`${guideKey}.title`),
      item: canonicalUrl,
    },
  ]);

  // Get related calculators
  const relatedCalcs = guide.relatedCalculators.map((id) => calculators.find((c) => c.id === id)).filter(Boolean);

  // Get the content component
  const ContentComponent = guideContentMap[slug];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd} />

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          {tCommon("home")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/guias" className="hover:text-foreground transition-colors">
          {t("index.title")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate">{t(`${guideKey}.title`)}</span>
      </div>

      {/* Page Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">{t(`${guideKey}.title`)}</h1>
        <p className="text-lg text-muted-foreground">{t(`${guideKey}.description`)}</p>
      </header>

      {/* Main Content */}
      <article className="prose prose-slate dark:prose-invert max-w-none">
        {ContentComponent && <ContentComponent t={guideT} />}
      </article>

      {/* Related Calculators */}
      {relatedCalcs.length > 0 && (
        <section className="mt-12 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">{t("index.relatedCalculators")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedCalcs.map((calc) => {
              const Icon = calc!.icon;
              return (
                <Link
                  key={calc!.id}
                  href={calc!.href}
                  className="group flex items-center gap-3 rounded-lg border bg-background p-4 transition-all hover:border-emerald-300 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium group-hover:text-emerald-600 transition-colors">
                      {tCalculators(`${calc!.id}.title`)}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{tCalculators(`${calc!.id}.description`)}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">{t("index.faqTitle")}</h2>
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <details key={index} className="group rounded-xl border bg-card p-4">
              <summary className="cursor-pointer font-medium list-none flex items-center justify-between">
                {item.question}
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.answer}</div>
            </details>
          ))}
        </div>
        <JsonLd data={faqJsonLd} />
      </section>

      {/* Back to guides */}
      <div className="mt-12 pt-6 border-t">
        <Button variant="outline" asChild className="gap-2">
          <Link href="/guias">
            <ArrowLeft className="h-4 w-4" />
            {t("index.viewAllGuides")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
