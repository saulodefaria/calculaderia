interface GuideContentProps {
  t: (key: string) => string;
}

export function ComoUsarContent({ t }: GuideContentProps) {
  return (
    <>
      <p className="lead">{t("content.intro")}</p>

      <section>
        <h2>{t("content.financiamento.title")}</h2>
        <ol>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i}>{t(`content.financiamento.steps.${i}`)}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>{t("content.jurosCompostos.title")}</h2>
        <ol>
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i}>{t(`content.jurosCompostos.steps.${i}`)}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>{t("content.tir.title")}</h2>
        <ol>
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>{t(`content.tir.steps.${i}`)}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>{t("content.rendaFixa.title")}</h2>
        <ol>
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>{t(`content.rendaFixa.steps.${i}`)}</li>
          ))}
        </ol>
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
