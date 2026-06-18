"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, FileText, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/index";
import type { ResultadoDecimoTerceiro } from "@/lib/calculators/decimo-terceiro";

interface ResultsSummaryProps {
  resultado: ResultadoDecimoTerceiro;
}

function SummaryCard({
  label,
  value,
  tone = "default",
  testId,
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning";
  testId?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : "";

  return (
    <div className="flex min-h-24 flex-col justify-center rounded-lg border p-4" data-testid={testId}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`mt-1 break-words font-mono text-xl font-bold ${toneClass}`}>{value}</span>
    </div>
  );
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.decimo-terceiro.results");
  const hasLegalTables2026 = resultado.warnings.includes("tabelasLegais2026");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgeDollarSign className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("badges.avos", { value: `${resultado.avos}/12` })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {hasLegalTables2026
                ? t("badges.tables", { year: resultado.descontosLegais.versao })
                : t("badges.grossManualOnly")}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label={t("cards.decimoBruto")} value={formatCurrency(resultado.decimoBruto)} />
            <SummaryCard
              label={t("cards.segundaParcela")}
              value={formatCurrency(resultado.segundaParcelaBrutaAntesDescontos)}
            />
            <SummaryCard
              label={t("cards.liquidoEstimado")}
              value={formatCurrency(resultado.liquidoEstimado)}
              tone="positive"
              testId="decimo-terceiro-net-result"
            />
            <SummaryCard label={t("cards.remuneracaoBase")} value={formatCurrency(resultado.remuneracaoBase)} />
            <SummaryCard label={t("cards.primeiraParcela")} value={formatCurrency(resultado.primeiraParcelaEstimada)} />
            <SummaryCard
              label={t("cards.descontosLegais")}
              value={formatCurrency(resultado.descontosLegais.total)}
              tone="warning"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4" />
                {t("installments.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("installments.first")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.primeiraParcelaEstimada)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("installments.advance")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.adiantamentoAplicado)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("installments.secondGross")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.segundaParcelaBrutaAntesDescontos)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("installments.excess")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.adiantamentoExcedente)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Landmark className="h-4 w-4" />
                {t("deductions.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("deductions.inss")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.inssDecimoTerceiro)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("deductions.irrf")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.irrfDecimoTerceiro)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("deductions.irrfBase")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.descontosLegais.baseIrrfUsada)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("deductions.manual")}</dt>
                  <dd className="font-mono font-semibold">
                    {formatCurrency(resultado.outrosDescontos - resultado.outrosAcrescimos)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {resultado.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                {t("warnings.title")}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {resultado.warnings.map((warning) => (
                  <li key={warning}>{t(`warnings.items.${warning}`)}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">{t("method.title")}</strong> {t("method.text")}
            </p>
            <p className="mt-2">
              {t("method.sourceNote", {
                accessDate: resultado.sourceVersion.legalRulesAccessedAt,
                inssYear: resultado.sourceVersion.inss,
                irrfYear: resultado.sourceVersion.irrf,
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
