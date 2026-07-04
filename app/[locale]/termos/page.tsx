import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function TermosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "institutional.terms" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const sections = ["usage", "noWarranty", "limitations", "intellectual", "changes"] as const;

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
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {sections.map((section) => (
          <section key={section} className="mb-8">
            <h2>{t(`${section}.title`)}</h2>
            <p>{t(`${section}.text`)}</p>
          </section>
        ))}

        <p className="text-sm text-muted-foreground mt-10">{t("lastUpdated")}</p>
      </div>
    </div>
  );
}
