import { getTranslations } from "next-intl/server";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function AvisoLegalPage() {
  const t = await getTranslations("institutional.disclaimer");
  const tCommon = await getTranslations("common");

  const sections = ["notAdvice", "professional", "accuracy", "liability", "sources"] as const;

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
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <p className="text-lg text-muted-foreground">{t("intro")}</p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section} className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-2">{t(`${section}.title`)}</h2>
            <p className="text-muted-foreground">{t(`${section}.text`)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
