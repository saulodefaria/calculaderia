interface GuideContentProps {
  t: (key: string) => string;
}

export function RendaFixaContent({ t }: GuideContentProps) {
  return (
    <>
      <p className="lead">{t("content.intro")}</p>

      <section>
        <h2>{t("content.types.title")}</h2>

        <div className="not-prose grid gap-4 my-6">
          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-lg font-semibold mb-2">{t("content.types.prefixado.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("content.types.prefixado.text")}</p>
          </div>
          <div className="rounded-xl border p-5 bg-card">
            <h3 className="text-lg font-semibold mb-2">{t("content.types.cdi.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("content.types.cdi.text")}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5">
            <h3 className="text-lg font-semibold mb-2 text-emerald-700 dark:text-emerald-400">
              {t("content.types.ipca.title")}
            </h3>
            <p className="text-sm">{t("content.types.ipca.text")}</p>
          </div>
        </div>
      </section>

      <section>
        <h2>{t("content.comparison.title")}</h2>
        <ul>
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>{t(`content.comparison.items.${i}`)}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t("content.taxes.title")}</h2>
        <p>{t("content.taxes.text")}</p>
        <div className="not-prose my-6 rounded-xl border bg-card p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">{t("labels.taxTable.headers.term")}</th>
                <th className="pb-2">{t("labels.taxTable.headers.rate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2">{t("labels.taxTable.rows.upTo180.term")}</td>
                <td className="py-2 font-medium">{t("labels.taxTable.rows.upTo180.rate")}</td>
              </tr>
              <tr>
                <td className="py-2">{t("labels.taxTable.rows.from181To360.term")}</td>
                <td className="py-2 font-medium">{t("labels.taxTable.rows.from181To360.rate")}</td>
              </tr>
              <tr>
                <td className="py-2">{t("labels.taxTable.rows.from361To720.term")}</td>
                <td className="py-2 font-medium">{t("labels.taxTable.rows.from361To720.rate")}</td>
              </tr>
              <tr>
                <td className="py-2">{t("labels.taxTable.rows.over720.term")}</td>
                <td className="py-2 font-medium text-emerald-600">{t("labels.taxTable.rows.over720.rate")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
