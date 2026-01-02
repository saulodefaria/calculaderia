interface GuideContentProps {
  t: (key: string) => string;
}

export function TirContent({ t }: GuideContentProps) {
  return (
    <>
      <p className="lead">{t("content.intro")}</p>

      <section>
        <h2>{t("content.howItWorks.title")}</h2>
        <p>{t("content.howItWorks.text")}</p>
      </section>

      <section>
        <h2>{t("content.interpretation.title")}</h2>
        <ul>
          {[0, 1, 2].map((i) => (
            <li key={i}>{t(`content.interpretation.items.${i}`)}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t("content.example.title")}</h2>
        <div className="not-prose my-6 rounded-xl border bg-card p-6">
          <p className="text-muted-foreground">{t("content.example.text")}</p>
          <div className="mt-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{t("content.example.result")}</p>
          </div>
        </div>
      </section>

      <section>
        <h2>{t("content.limitations.title")}</h2>
        <div className="not-prose my-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-5">
          <ul className="space-y-2 text-sm">
            {[0, 1, 2].map((i) => (
              <li key={i}>⚠️ {t(`content.limitations.items.${i}`)}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
