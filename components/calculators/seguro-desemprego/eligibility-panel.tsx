"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/index";
import type {
  ResultadoSeguroDesemprego,
  SeguroDesempregoChecklistItem,
  SeguroDesempregoChecklistStatus,
} from "@/lib/calculators/seguro-desemprego";

interface EligibilityPanelProps {
  resultado: ResultadoSeguroDesemprego;
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function StatusIcon({ status }: { status: SeguroDesempregoChecklistStatus }) {
  if (status === "pass") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
  }

  if (status === "warning") {
    return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
  }

  return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
}

function checklistValue(item: SeguroDesempregoChecklistItem, t: ReturnType<typeof useTranslations>): string {
  if (item.value === null || item.value === undefined) return "-";
  if (typeof item.value === "boolean") return item.value ? t("values.yes") : t("values.no");
  if (item.id === "motivoDispensa") return t(`reasons.${item.value}`);
  if (item.id === "janelaRequerimento") return t("values.daysAfterDismissal", { count: item.value });
  if (item.id === "mesesSalario" || item.id === "mesesTrabalhados36") {
    return t("values.months", { count: item.value });
  }
  return String(item.value);
}

export function EligibilityPanel({ resultado }: EligibilityPanelProps) {
  const locale = useLocale();
  const t = useTranslations("calculators.seguro-desemprego.eligibility");
  const memoryRows = [
    { label: t("memory.rows.averageSalary"), value: formatCurrency(resultado.salarioMedio) },
    {
      label: t("memory.rows.salariesUsed"),
      value: resultado.salariosConsiderados.map((salary) => formatCurrency(salary)).join(" / "),
    },
    { label: t("memory.rows.band"), value: t(`bands.${resultado.salaryBand}`) },
    { label: t("memory.rows.rawParcel"), value: formatCurrency(resultado.parcelaBruta) },
    { label: t("memory.rows.floorCeiling"), value: t("memory.floorCeilingValue") },
    {
      label: t("memory.rows.parcelRule"),
      value: resultado.parcelRule
        ? t("memory.parcelRuleValue", {
            count: resultado.parcelRule.quantidadeParcelas,
            min: resultado.parcelRule.minMonths,
            max: resultado.parcelRule.maxMonths ?? "36",
          })
        : t("memory.noParcelRule"),
    },
    {
      label: t("memory.rows.eligibilityThreshold"),
      value: resultado.eligibilityThreshold.consecutive
        ? t("memory.thresholdConsecutive", { months: resultado.eligibilityThreshold.requiredMonths })
        : t("memory.thresholdWindow", {
            months: resultado.eligibilityThreshold.requiredMonths,
            window: resultado.eligibilityThreshold.windowMonths,
          }),
    },
    {
      label: t("memory.rows.requestWindow"),
      value: t(`requestWindow.${resultado.requestWindow.status}`, {
        days: resultado.requestWindow.diasAposDispensa ?? "-",
        start: formatDate(resultado.requestWindow.dataInicio, locale),
        end: formatDate(resultado.requestWindow.dataFim, locale),
      }),
    },
    { label: t("memory.rows.source"), value: t("sourceBadge") },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("checklist.title")}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {resultado.checklist.map((item) => (
              <div key={item.id} className="rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <StatusIcon status={item.status} />
                  <span className="text-sm font-medium">{t(`checklist.items.${item.id}.label`)}</span>
                </div>
                <p className="mt-2 font-mono text-sm">{checklistValue(item, t)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.reason ? t(`reasonsHelp.${item.reason}`) : t(`checklist.items.${item.id}.help`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("memory.title")}
          </h3>
          <div className="mt-3 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("memory.columns.item")}</TableHead>
                  <TableHead>{t("memory.columns.value")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memoryRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="whitespace-normal font-medium">{row.label}</TableCell>
                    <TableCell className="whitespace-normal font-mono text-sm">{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
