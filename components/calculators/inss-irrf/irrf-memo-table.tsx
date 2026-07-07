"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ResultadoInssIrrf } from "@/lib/calculators/inss-irrf";

interface IrrfMemoTableProps {
  resultado: ResultadoInssIrrf;
}

export function IrrfMemoTable({ resultado }: IrrfMemoTableProps) {
  const t = useTranslations("calculators.inss-irrf.irrfMemo");
  const rows = [
    { id: "standardBase", label: t("rows.standardBase"), value: formatCurrency(resultado.baseIrrfPadrao) },
    { id: "simplifiedBase", label: t("rows.simplifiedBase"), value: formatCurrency(resultado.baseIrrfSimplificada) },
    { id: "selectedBase", label: t("rows.selectedBase"), value: formatCurrency(resultado.baseIrrfUsada) },
    { id: "dependents", label: t("rows.dependents"), value: formatCurrency(resultado.deducaoDependentes) },
    { id: "alimony", label: t("rows.alimony"), value: formatCurrency(resultado.pensaoAlimenticia) },
    {
      id: "bracket",
      label: t("rows.bracket"),
      value: t("values.bracket", {
        rate: formatPercent(resultado.aliquotaFaixaIrrf * 100),
        deduction: formatCurrency(resultado.parcelaDeduzirIrrf),
      }),
    },
    { id: "taxBeforeReduction", label: t("rows.taxBeforeReduction"), value: formatCurrency(resultado.irrfAntesReducao) },
    { id: "monthlyReduction", label: t("rows.monthlyReduction"), value: formatCurrency(resultado.reducaoIrrfMensal) },
    { id: "finalTax", label: t("rows.finalTax"), value: formatCurrency(resultado.irrf) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[620px]" data-testid="inss-irrf-irrf-memo-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.item")}</TableHead>
                <TableHead className="text-right">{t("columns.value")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right font-mono">{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="px-4 pb-4 text-sm text-muted-foreground sm:px-0 sm:pb-0">
          {t(`baseType.${resultado.tipoBaseIrrfUsada}`)}
        </p>
      </CardContent>
    </Card>
  );
}
