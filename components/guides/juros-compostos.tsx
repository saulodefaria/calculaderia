interface GuideContentProps {
  t: (key: string) => string;
}

export function JurosCompostosContent({ t }: GuideContentProps) {
  return (
    <>
      <p className="lead">{t("content.intro")}</p>

      <section>
        <h2>{t("content.formula.title")}</h2>
        <div className="not-prose my-6 rounded-xl border bg-card p-6 text-center">
          <code className="text-xl font-mono font-semibold">{t("content.formula.code")}</code>
          <p className="mt-3 text-sm text-muted-foreground">{t("content.formula.text")}</p>
        </div>
      </section>

      <section>
        <h2>{t("content.example.title")}</h2>
        <p>{t("content.example.text")}</p>
        <div className="not-prose grid gap-4 md:grid-cols-2 my-6">
          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-lg font-semibold mb-3 text-muted-foreground">{t("labels.simpleInterest")}</h3>
            <p className="text-sm text-muted-foreground">{t("content.example.simple")}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5">
            <h3 className="text-lg font-semibold mb-3 text-emerald-700 dark:text-emerald-400">
              {t("labels.compoundInterest")}
            </h3>
            <p className="text-sm">{t("content.example.compound")}</p>
          </div>
        </div>
        <p className="text-center font-medium text-emerald-600">{t("content.example.difference")}</p>
      </section>

      <section>
        <h2>{t("content.power.title")}</h2>
        <p>{t("content.power.text")}</p>
      </section>

      <section>
        <h2>{t("content.tips.title")}</h2>
        <ul>
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>{t(`content.tips.items.${i}`)}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
