interface GuideContentProps {
  t: (key: string) => string;
}

export function FinanciamentoVsConsorcioContent({ t }: GuideContentProps) {
  return (
    <>
      <p className="lead">{t("content.intro")}</p>

      <section>
        <h2>{t("content.financiamento.title")}</h2>
        <p>{t("content.financiamento.text")}</p>

        <div className="not-prose grid gap-4 md:grid-cols-2 my-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5">
            <h3 className="text-sm font-semibold mb-3 text-emerald-700 dark:text-emerald-400">{t("labels.pros")}</h3>
            <ul className="space-y-2 text-sm">
              {[0, 1, 2].map((i) => (
                <li key={i}>✓ {t(`content.financiamento.pros.${i}`)}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-5">
            <h3 className="text-sm font-semibold mb-3 text-red-700 dark:text-red-400">{t("labels.cons")}</h3>
            <ul className="space-y-2 text-sm">
              {[0, 1, 2].map((i) => (
                <li key={i}>✗ {t(`content.financiamento.cons.${i}`)}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>{t("content.consorcio.title")}</h2>
        <p>{t("content.consorcio.text")}</p>

        <div className="not-prose grid gap-4 md:grid-cols-2 my-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5">
            <h3 className="text-sm font-semibold mb-3 text-emerald-700 dark:text-emerald-400">{t("labels.pros")}</h3>
            <ul className="space-y-2 text-sm">
              {[0, 1, 2].map((i) => (
                <li key={i}>✓ {t(`content.consorcio.pros.${i}`)}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-5">
            <h3 className="text-sm font-semibold mb-3 text-red-700 dark:text-red-400">{t("labels.cons")}</h3>
            <ul className="space-y-2 text-sm">
              {[0, 1, 2].map((i) => (
                <li key={i}>✗ {t(`content.consorcio.cons.${i}`)}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>{t("content.comparison.title")}</h2>
        <p>{t("content.comparison.example")}</p>

        <div className="not-prose grid gap-4 md:grid-cols-2 my-6">
          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-lg font-semibold mb-3">{t("labels.financiamento")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• {t("content.comparison.financiamento.entry")}</li>
              <li>• {t("content.comparison.financiamento.payment")}</li>
              <li className="font-medium text-foreground">• {t("content.comparison.financiamento.total")}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5">
            <h3 className="text-lg font-semibold mb-3 text-emerald-700 dark:text-emerald-400">
              {t("labels.consorcio")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• {t("content.comparison.consorcio.entry")}</li>
              <li>• {t("content.comparison.consorcio.payment")}</li>
              <li className="font-medium">• {t("content.comparison.consorcio.total")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>{t("content.whenToUse.title")}</h2>
        <div className="not-prose grid gap-4 md:grid-cols-2 my-6">
          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-lg font-semibold mb-3">{t("labels.financiamento")}</h3>
            <p className="text-sm text-muted-foreground">{t("content.whenToUse.financiamento")}</p>
          </div>
          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-lg font-semibold mb-3">{t("labels.consorcio")}</h3>
            <p className="text-sm text-muted-foreground">{t("content.whenToUse.consorcio")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
