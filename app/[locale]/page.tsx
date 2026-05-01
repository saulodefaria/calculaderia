import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { calculators } from "@/lib/constants";
import { getGuideBySlug } from "@/lib/guides";
import { CalculatorCard } from "@/components/calculators/calculator-card";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  getSiteUrlObject,
  createFaqJsonLd,
  createWebSiteJsonLd,
  createOrganizationJsonLd,
  createItemListJsonLd,
  getOpenGraphImages,
  getTwitterImages,
} from "@/lib/seo";
import { getAlternateLanguagePathnames, getLocalizedPathname } from "@/i18n/paths";
import { GitHubLogo } from "@/components/ui/brand-icons";
import {
  ArrowRight,
  Calculator,
  TrendingUp,
  Shield,
  UserX,
  Lock,
  ClipboardList,
  BarChart3,
  Share2,
  ChevronRight,
  BookOpen,
} from "lucide-react";

// Most popular calculators (for Brazil)
const popularCalculatorIds = ["financiamento", "juros-compostos", "renda-fixa", "consorcio"];

const featuredGuidesPreview = [
  { slug: "sac-vs-price" },
  { slug: "juros-compostos-como-calcular" },
  { slug: "tir-o-que-e-como-calcular" },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const canonicalPath = getLocalizedPathname(locale, "/");
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    metadataBase: getSiteUrlObject(),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: getAlternateLanguagePathnames("/", { includeXDefault: true }),
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
      siteName: "Calculaderia",
      images: getOpenGraphImages(title),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: getTwitterImages(title),
    },
  };
}

export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations("home");
  const tCalculators = await getTranslations("calculators");
  const tGuides = await getTranslations("guides");
  const availableCalculators = calculators.filter((c) => c.available);
  const popularCalculators = availableCalculators.filter((c) => popularCalculatorIds.includes(c.id));
  const featuredGuides = featuredGuidesPreview
    .map((g) => getGuideBySlug(g.slug))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  // FAQ data
  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
  const faqItems = faqIds.map((id) => ({
    question: t(`faq.items.${id}.question`),
    answer: t(`faq.items.${id}.answer`),
  }));

  // JSON-LD structured data
  const faqJsonLd = createFaqJsonLd(faqItems);
  const websiteJsonLd = createWebSiteJsonLd({
    name: "Calculaderia",
    url: absoluteUrl("/"),
    description: t("metaDescription"),
  });
  const organizationJsonLd = createOrganizationJsonLd({
    name: "Calculaderia",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
    sameAs: ["https://github.com/saulodefaria/calculaderia"],
  });
  const itemListJsonLd = createItemListJsonLd({
    items: availableCalculators.map((calc) => ({
      name: tCalculators(`${calc.id}.title`),
      url: absoluteUrl(getLocalizedPathname(locale, calc.href)),
    })),
  });

  return (
    <div className="flex flex-col">
      {/* JSON-LD */}
      <JsonLd data={websiteJsonLd} id="website-jsonld" />
      <JsonLd data={organizationJsonLd} id="organization-jsonld" />
      <JsonLd data={itemListJsonLd} id="itemlist-jsonld" />

      {/* Hero Section - SEO optimized */}
      <section className="relative overflow-hidden bg-linear-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
        <div className="container relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Calculator className="h-4 w-4" />
              {t("badge")}
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t("title")}</h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{t("subtitle")}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <a href="#calculadoras">
                  {t("cta")}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#como-funciona">{t("ctaSecondary")}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Calculators - Quick Access */}
      <section className="border-b bg-muted/30 py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              {t("popular.title")}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popularCalculators.map((calc) => {
              const Icon = calc.icon;
              return (
                <Link
                  key={calc.id}
                  href={calc.href}
                  className="group flex h-full items-center gap-3 rounded-xl border bg-background p-4 transition-all hover:border-emerald-300 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium wrap-break-word group-hover:text-emerald-600 transition-colors">
                      {tCalculators(`${calc.id}.title`)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* All Calculators Grid */}
        <section id="calculadoras" className="scroll-mt-20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("availableCalculators")}</h2>
            <p className="mt-2 text-muted-foreground">{t("availableCalculatorsDescription")}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {availableCalculators.map((calculator) => (
              <CalculatorCard key={calculator.id} calculatorId={calculator.id} />
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="como-funciona" className="mt-20 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("howItWorks.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("howItWorks.subtitle")}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: ClipboardList, step: "step1", number: "1" },
              { icon: BarChart3, step: "step2", number: "2" },
              { icon: Share2, step: "step3", number: "3" },
            ].map(({ icon: Icon, step, number }) => (
              <div key={step} className="relative text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {number}
                </div>
                <h3 className="text-lg font-semibold">{t(`howItWorks.steps.${step}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`howItWorks.steps.${step}.description`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Use Calculaderia */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("whyUse.title")}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, feature: "free" },
              { icon: UserX, feature: "noSignup" },
              { icon: GitHubLogo, feature: "openSource" },
              { icon: Lock, feature: "privacy" },
            ].map(({ icon: Icon, feature }) => (
              <div
                key={feature}
                className="rounded-xl border bg-card p-6 text-center transition-colors hover:border-emerald-200">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{t(`whyUse.features.${feature}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`whyUse.features.${feature}.description`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Guides Preview Section */}
        <section className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("guides.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("guides.subtitle")}</p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex gap-2">
              <Link href="/guias">
                {t("guides.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guias/${guide.slug}`}
                className="group rounded-xl border bg-card p-5 transition-all hover:border-emerald-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium group-hover:text-emerald-600 transition-colors">
                      {tGuides(guide.titleKey.replace("guides.", ""))}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 sm:hidden">
            <Button variant="outline" asChild className="w-full gap-2">
              <Link href="/guias">
                {t("guides.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mt-20 scroll-mt-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("faq.title")}</h2>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqIds.map((id) => (
              <details key={id} className="group rounded-xl border bg-card p-4">
                <summary className="cursor-pointer font-medium list-none flex items-center justify-between">
                  {t(`faq.items.${id}.question`)}
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{t(`faq.items.${id}.answer`)}</div>
              </details>
            ))}
          </div>
          <JsonLd data={faqJsonLd} id="faq-jsonld" />
        </section>

        {/* Trust Section */}
        <section className="mt-20">
          <div className="rounded-2xl border bg-linear-to-br from-slate-50 to-slate-100 p-8 dark:from-slate-900/50 dark:to-slate-800/50">
            <h2 className="text-center text-xl font-semibold mb-6">{t("trust.title")}</h2>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <GitHubLogo className="h-5 w-5 text-emerald-600" />
                <span>{t("trust.openSource")}</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-600" />
                <span>{t("trust.privacy")}</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span>{t("trust.disclaimer")}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
