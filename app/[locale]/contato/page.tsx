import { getTranslations } from "next-intl/server";
import { ArrowLeft, Bug, ExternalLink, Lightbulb, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkedInLogo } from "@/components/ui/brand-icons";
import { Link } from "@/i18n/navigation";

export default async function ContatoPage() {
  const t = await getTranslations("institutional.contact");
  const tCommon = await getTranslations("common");

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
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              <Bug className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">{t("bugs.title")}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t("bugs.text")}</p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/saulodefaria/calculaderia/issues/new?labels=bug"
                  target="_blank"
                  rel="noopener noreferrer">
                  {t("bugs.cta")}
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">{t("features.title")}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t("features.text")}</p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/saulodefaria/calculaderia/issues/new?labels=enhancement"
                  target="_blank"
                  rel="noopener noreferrer">
                  {t("features.cta")}
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">{t("general.title")}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t("general.text")}</p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.linkedin.com/in/saulodefaria/" target="_blank" rel="noopener noreferrer">
                  <LinkedInLogo className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
