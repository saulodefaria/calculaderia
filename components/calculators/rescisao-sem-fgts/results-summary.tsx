"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, BriefcaseBusiness, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/index";
import type {
  InputsRescisaoSemFgts,
  ResultadoRescisaoSemFgts,
} from "@/lib/calculators/rescisao-sem-fgts";

interface ResultsSummaryProps {
  inputs: InputsRescisaoSemFgts;
  resultado: ResultadoRescisaoSemFgts;
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

export function ResultsSummary({ inputs, resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.rescisao-sem-fgts.results");
  const warningCodes = [
    "fgtsOutside",
    "unpaidFgts",
    resultado.totalLiquido < 0 ? "negativeNet" : null,
    resultado.warnings.includes("tabelasLegais2026") ? "tabelasLegais2026" : null,
    resultado.warnings.includes("descontosLegaisDesativados") ? "descontosLegaisDesativados" : null,
  ].filter(Boolean) as string[];

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard
              label={t("cards.totalBruto")}
              value={formatCurrency(resultado.totalBruto)}
              testId="rescisao-sem-fgts-total-bruto"
            />
            <SummaryCard
              label={t("cards.totalDescontos")}
              value={formatCurrency(resultado.totalDescontos)}
              tone="warning"
              testId="rescisao-sem-fgts-total-descontos"
            />
            <SummaryCard
              label={t("cards.totalLiquido")}
              value={formatCurrency(resultado.totalLiquido)}
              tone={resultado.totalLiquido < 0 ? "warning" : "positive"}
              testId="rescisao-sem-fgts-total-liquido"
            />
            <SummaryCard
              label={t("cards.multaFgts")}
              value={formatCurrency(resultado.multaFgts)}
              testId="rescisao-sem-fgts-multa-fgts"
            />
            <SummaryCard
              label={t("cards.saqueFgts")}
              value={formatCurrency(resultado.saqueFgts)}
              testId="rescisao-sem-fgts-saque-fgts"
            />
            <SummaryCard
              label={t("cards.noticeEffect")}
              value={formatCurrency(resultado.avisoDesconto)}
              tone={resultado.avisoDesconto > 0 ? "warning" : "default"}
              testId="rescisao-sem-fgts-aviso"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <BriefcaseBusiness className="h-4 w-4" />
                {t("scenario.title")}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(`scenario.items.${inputs.cenarioSemFgts}`)}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("scenario.included")}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {resultado.direitosIncluidos.map((right) => (
                      <li key={right}>{t(`rights.${right}`)}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("scenario.excluded")}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {resultado.direitosExcluidos.map((right) => (
                      <li key={right}>{t(`rights.${right}`)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4" />
                {t("fgts.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("fgts.fine")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.multaFgts)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("fgts.withdrawal")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.saqueFgts)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("fgts.baseMulta")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseMultaFgts)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("fgts.rescisoryDeposit")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.fgtsRescisorioEstimado)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              {t("warnings.title")}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {warningCodes.map((warning) => (
                <li key={warning}>{t(`warnings.items.${warning}`)}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">{t("method.title")}</strong> {t("method.text")}
            </p>
            <p className="mt-2">{t("method.sourceNote")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
