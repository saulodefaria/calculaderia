import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Code, Target, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubLogo } from "@/components/ui/brand-icons";
import { Link } from "@/i18n/navigation";

export default async function SobrePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "institutional.about" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
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
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-4">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("intro")}</p>
      </div>

      {/* Content */}
      <div className="space-y-10">
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t("mission.title")}</h2>
              <p className="text-muted-foreground">{t("mission.text")}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t("creator.title")}</h2>
              <p className="text-muted-foreground">{t("creator.text")}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <GitHubLogo className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t("openSource.title")}</h2>
              <p className="text-muted-foreground mb-4">{t("openSource.text")}</p>
              <Button variant="outline" asChild>
                <a href="https://github.com/saulodefaria/calculaderia" target="_blank" rel="noopener noreferrer">
                  <GitHubLogo className="h-4 w-4 mr-2" />
                  {t("openSource.cta")}
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t("methodology.title")}</h2>
              <p className="text-muted-foreground">{t("methodology.text")}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
