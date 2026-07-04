import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { guides } from "@/lib/guides";
import { calculators } from "@/lib/constants";

export default async function GuiasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "guides" });
  const tCalculators = await getTranslations({ locale, namespace: "calculators" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
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
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("index.title")}</h1>
        <p className="text-muted-foreground text-lg">{t("index.description")}</p>
      </div>

      {/* Guides Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => {
          const Icon = guide.icon;
          const relatedCalcs = guide.relatedCalculators
            .map((id) => calculators.find((c) => c.id === id))
            .filter(Boolean);

          return (
            <Link
              key={guide.slug}
              href={`/guias/${guide.slug}`}
              className="group rounded-xl border bg-card p-6 transition-all hover:border-emerald-300 hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {t(guide.titleKey.replace("guides.", ""))}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {t(guide.descriptionKey.replace("guides.", ""))}
                  </p>
                </div>
              </div>

              {/* Related calculators */}
              {relatedCalcs.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">{t("index.relatedCalculators")}:</p>
                  <div className="flex flex-wrap gap-2">
                    {relatedCalcs.slice(0, 2).map((calc) => (
                      <span key={calc!.id} className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
                        {tCalculators(`${calc!.id}.title`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                {t("index.readGuide")}
                <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
