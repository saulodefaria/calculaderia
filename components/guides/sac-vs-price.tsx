interface GuideContentProps {
  t: (key: string) => string;
}

export function SacVsPriceContent({ t }: GuideContentProps) {
  return (
    <>
      <p className="lead">{t("content.intro")}</p>

      <section>
        <h2>{t("content.whatIsSac.title")}</h2>
        <p>{t("content.whatIsSac.p1")}</p>
        <p>{t("content.whatIsSac.p2")}</p>
      </section>

      <section>
        <h2>{t("content.whatIsPrice.title")}</h2>
        <p>{t("content.whatIsPrice.p1")}</p>
        <p>{t("content.whatIsPrice.p2")}</p>
      </section>

      <section>
        <h2>{t("content.comparison.title")}</h2>
        <p>{t("content.comparison.intro")}</p>

        <div className="not-prose grid gap-4 md:grid-cols-2 my-6">
          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-lg font-semibold mb-3">{t("content.comparison.sac.title")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• {t("content.comparison.sac.firstPayment")}</li>
              <li>• {t("content.comparison.sac.lastPayment")}</li>
              <li className="font-medium text-foreground">• {t("content.comparison.sac.totalInterest")}</li>
            </ul>
          </div>
          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-lg font-semibold mb-3">{t("content.comparison.price.title")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• {t("content.comparison.price.firstPayment")}</li>
              <li>• {t("content.comparison.price.lastPayment")}</li>
              <li className="font-medium text-foreground">• {t("content.comparison.price.totalInterest")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>{t("content.whenToUse.title")}</h2>
        <div className="not-prose grid gap-4 md:grid-cols-2 my-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5">
            <h3 className="text-lg font-semibold mb-3 text-emerald-700 dark:text-emerald-400">
              {t("content.whenToUse.sacBetter.title")}
            </h3>
            <ul className="space-y-2 text-sm">
              {[0, 1, 2].map((i) => (
                <li key={i}>✓ {t(`content.whenToUse.sacBetter.items.${i}`)}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-5">
            <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-400">
              {t("content.whenToUse.priceBetter.title")}
            </h3>
            <ul className="space-y-2 text-sm">
              {[0, 1, 2].map((i) => (
                <li key={i}>✓ {t(`content.whenToUse.priceBetter.items.${i}`)}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="not-prose">
        <div className="rounded-xl border bg-muted/30 p-5">
          <h3 className="text-lg font-semibold mb-2">{t("content.tip.title")}</h3>
          <p className="text-muted-foreground">{t("content.tip.text")}</p>
        </div>
      </section>
    </>
  );
}




