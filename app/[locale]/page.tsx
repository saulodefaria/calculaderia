import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getAvailableTools, getPopularTools, getToolsByFamily, getVisibleToolFamilies, type ToolDefinition } from "@/lib/constants";
import { getGuideBySlug } from "@/lib/guides";
import { ToolCard } from "@/components/tools/tool-card";
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
  Wrench,
} from "lucide-react";

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

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const tTools = await getTranslations({ locale, namespace: "tools" });
  const tCalculators = await getTranslations({ locale, namespace: "calculators" });
  const tFamilies = await getTranslations({ locale, namespace: "toolFamilies" });
  const tGuides = await getTranslations({ locale, namespace: "guides" });
  const availableTools = getAvailableTools();
  const popularTools = getPopularTools().slice(0, 8);
  const visibleFamilies = getVisibleToolFamilies();
  const featuredGuides = featuredGuidesPreview
    .map((g) => getGuideBySlug(g.slug))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const getToolTitle = (tool: ToolDefinition) => {
    const toolT = tool.familyId === "calculadoras" ? tCalculators : tTools;
    return toolT(`${tool.id}.title`);
  };

  const faqIds = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
  const faqItems = faqIds.map((id) => ({
    question: t(`faq.items.${id}.question`),
    answer: t(`faq.items.${id}.answer`),
  }));

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
    items: availableTools.map((tool) => ({
      name: getToolTitle(tool),
      url: absoluteUrl(getLocalizedPathname(locale, tool.href)),
    })),
  });

  return (
    <div className="flex flex-col">
      <JsonLd data={websiteJsonLd} id="website-jsonld" />
      <JsonLd data={organizationJsonLd} id="organization-jsonld" />
      <JsonLd data={itemListJsonLd} id="itemlist-jsonld" />

      <section className="relative overflow-hidden bg-linear-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
        <div className="container relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Wrench className="h-4 w-4" />
              {t("badge")}
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t("title")}</h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{t("subtitle")}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <a href="#ferramentas">
                  {t("cta")}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/ferramentas">{t("ctaSecondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-muted/30 py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              {t("popular.title")}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popularTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group flex h-full items-center gap-3 rounded-xl border bg-background p-4 transition-all hover:border-emerald-300 hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="wrap-break-word font-medium transition-colors group-hover:text-emerald-600">
                      {getToolTitle(tool)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-emerald-600" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <section id="ferramentas" className="scroll-mt-20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("availableTools")}</h2>
            <p className="mt-2 text-muted-foreground">{t("availableToolsDescription")}</p>
          </div>

          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {visibleFamilies.map((family) => {
              const Icon = family.icon;
              const toolCount = getToolsByFamily(family.id).length;

              return (
                <Link
                  key={family.id}
                  href={family.href}
                  data-testid={`home-tool-family-card-${family.slug}`}
                  className="group flex h-full flex-col rounded-lg border bg-card p-5 transition-all hover:border-emerald-300 hover:shadow-md">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold group-hover:text-emerald-600">
                      {tFamilies(`${family.id}.title`)}
                    </h3>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    {tFamilies(`${family.id}.description`)}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm font-medium text-emerald-600">
                    <span>{t("categories.tools", { count: toolCount })}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="space-y-10">
            {visibleFamilies.map((family) => {
              const familyTools = getToolsByFamily(family.id);
              if (familyTools.length === 0) return null;

              return (
                <section key={family.id} aria-labelledby={`home-familia-${family.slug}`}>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 id={`home-familia-${family.slug}`} className="text-xl font-semibold tracking-tight">
                        {tFamilies(`${family.id}.title`)}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tFamilies(`${family.id}.description`)}
                      </p>
                    </div>
                    <Link
                      href={family.href}
                      className="hidden shrink-0 items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 sm:flex">
                      {t("categories.viewFamily")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {familyTools.map((tool) => (
                      <ToolCard key={tool.id} toolId={tool.id} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section id="como-funciona" className="mt-20 scroll-mt-20">
          <div className="mb-12 text-center">
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
                <div className="absolute -top-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {number}
                </div>
                <h3 className="text-lg font-semibold">{t(`howItWorks.steps.${step}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`howItWorks.steps.${step}.description`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-12 text-center">
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

        <section className="mt-20">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("guides.title")}</h2>
              <p className="mt-2 text-muted-foreground">{t("guides.subtitle")}</p>
            </div>
            <Button variant="outline" asChild className="hidden gap-2 sm:flex">
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
                    <h3 className="font-medium transition-colors group-hover:text-emerald-600">
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

        <section id="faq" className="mt-20 scroll-mt-20">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("faq.title")}</h2>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqIds.map((id) => (
              <details key={id} className="group rounded-xl border bg-card p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {t(`faq.items.${id}.question`)}
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(`faq.items.${id}.answer`)}</div>
              </details>
            ))}
          </div>
          <JsonLd data={faqJsonLd} id="faq-jsonld" />
        </section>

        <section className="mt-20">
          <div className="rounded-2xl border bg-linear-to-br from-slate-50 to-slate-100 p-8 dark:from-slate-900/50 dark:to-slate-800/50">
            <h2 className="mb-6 text-center text-xl font-semibold">{t("trust.title")}</h2>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <GitHubLogo className="h-5 w-5 text-emerald-600" />
                <span>{t("trust.openSource")}</span>
              </div>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-600" />
                <span>{t("trust.privacy")}</span>
              </div>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <span>{t("trust.disclaimer")}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
