"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, ArrowDown, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatCurrencyInput, parseCurrencyValue, getAluguelCorrigidoNoMes } from "@/lib/utils/index";
import type {
  Parcela,
  ParcelaComAdicional,
  AmortizacaoAdicional,
  TipoAmortizacaoAdicional,
  InputsFinanciamento,
} from "@/lib/calculators/financiamento";

interface AmortizationTableProps {
  parcelas: Parcela[] | ParcelaComAdicional[];
  amortizacoesAdicionais?: AmortizacaoAdicional[];
  onAmortizacaoChange?: (mes: number, valor: number, tipo: TipoAmortizacaoAdicional) => void;
  inputs?: InputsFinanciamento | null;
}

// Popover form for editing extra amortization
interface AmortizacaoPopoverProps {
  mes: number;
  currentValue: number;
  currentTipo: TipoAmortizacaoAdicional;
  onSave: (mes: number, valor: number, tipo: TipoAmortizacaoAdicional) => void;
  onRemove: (mes: number) => void;
  children: React.ReactNode;
}

function AmortizacaoPopover({ mes, currentValue, currentTipo, onSave, onRemove, children }: AmortizacaoPopoverProps) {
  const t = useTranslations("calculators.financiamento.table");
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    currentValue > 0 ? formatCurrencyInput(String(Math.round(currentValue * 100))) : ""
  );
  const [tipo, setTipo] = useState<TipoAmortizacaoAdicional>(currentTipo);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reset form values when opening
      setInputValue(currentValue > 0 ? formatCurrencyInput(String(Math.round(currentValue * 100))) : "");
      setTipo(currentTipo);
    }
  };

  const handleSave = () => {
    const valor = parseCurrencyValue(inputValue);
    onSave(mes, valor, tipo);
    setOpen(false);
  };

  const handleRemove = () => {
    onRemove(mes);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">{t("popover.title", { month: mes })}</h4>

          <div className="space-y-2">
            <Label htmlFor={`valor-${mes}`} className="text-xs">
              {t("popover.amount.label")}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id={`valor-${mes}`}
                type="text"
                inputMode="numeric"
                placeholder={t("popover.amount.placeholder")}
                value={inputValue}
                onChange={(e) => setInputValue(formatCurrencyInput(e.target.value))}
                className="pl-10 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{t("popover.type.label")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo("prazo")}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  tipo === "prazo"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-muted hover:border-muted-foreground/30"
                }`}>
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">{t("popover.type.options.prazo.label")}</span>
                <span className="text-[10px] text-muted-foreground text-center">
                  {t("popover.type.options.prazo.help")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTipo("parcela")}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  tipo === "parcela"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-muted hover:border-muted-foreground/30"
                }`}>
                <ArrowDown className="h-4 w-4" />
                <span className="text-xs font-medium">{t("popover.type.options.parcela.label")}</span>
                <span className="text-[10px] text-muted-foreground text-center">
                  {t("popover.type.options.parcela.help")}
                </span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {currentValue > 0 && (
              <Button variant="outline" size="sm" className="text-red-600" onClick={handleRemove}>
                {t("popover.actions.remove")}
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={parseCurrencyValue(inputValue) === 0}>
              {t("popover.actions.apply")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AmortizationTable({
  parcelas,
  amortizacoesAdicionais = [],
  onAmortizacaoChange,
  inputs,
}: AmortizationTableProps) {
  const t = useTranslations("calculators.financiamento.table");
  const [showAll, setShowAll] = useState(false);

  const handleSave = useCallback(
    (mes: number, valor: number, tipo: TipoAmortizacaoAdicional) => {
      onAmortizacaoChange?.(mes, valor, tipo);
    },
    [onAmortizacaoChange]
  );

  const handleRemove = useCallback(
    (mes: number) => {
      onAmortizacaoChange?.(mes, 0, "prazo");
    },
    [onAmortizacaoChange]
  );

  if (parcelas.length === 0) {
    return null;
  }

  // Check if we have additional amortization data
  const hasAdicionais = amortizacoesAdicionais.some((a) => a.valor > 0);

  // Aluguel info from inputs
  const aluguelMensal = inputs?.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs?.correcaoAnualAluguel ?? 0;
  const hasAluguel = aluguelMensal > 0;

  // Show first 12 months and last 12 months by default (to give a good overview)
  const displayParcelas = showAll
    ? parcelas
    : parcelas.length <= 24
    ? parcelas
    : [
        ...parcelas.slice(0, 12),
        null, // Marker for collapsed rows
        ...parcelas.slice(-12),
      ];

  const collapsedCount = parcelas.length - 24;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        {onAmortizacaoChange && (
          <p className="text-sm text-muted-foreground">
            {t.rich("hint", {
              plus: () => <Plus className="inline h-3 w-3" />,
            })}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <Table className="min-w-[700px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 bg-background z-20">
                  {t("columns.month")}
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">{t("columns.openingBalance")}</TableHead>
                <TableHead className="text-right">{t("columns.interest")}</TableHead>
                <TableHead className="text-right whitespace-nowrap">{t("columns.principal")}</TableHead>
                <TableHead className="text-right">{t("columns.payment")}</TableHead>
                {hasAluguel && (
                  <TableHead className="text-right whitespace-nowrap text-purple-600 dark:text-purple-400">
                    {t("columns.netPayment")}
                  </TableHead>
                )}
                <TableHead className="text-right whitespace-nowrap">{t("columns.endingBalance")}</TableHead>
                {onAmortizacaoChange && (
                  <TableHead className="w-10 text-center">
                    <span className="sr-only">{t("columns.actions")}</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayParcelas.map((parcela) => {
                // Handle collapsed row marker
                if (parcela === null) {
                  const colSpan = 6 + (hasAluguel ? 1 : 0) + (onAmortizacaoChange ? 1 : 0);
                  return (
                    <TableRow key="collapsed">
                      <TableCell colSpan={colSpan} className="text-center py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAll(true)}
                          className="text-muted-foreground hover:text-foreground">
                          <ChevronDown className="h-4 w-4 mr-2" />
                          {t("collapsed.showHidden", { count: collapsedCount })}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }

                const amortAdicional = amortizacoesAdicionais.find((a) => a.mes === parcela.mes);
                const hasExtraValue = (amortAdicional?.valor ?? 0) > 0;

                // Check if this row has additional amortization applied (in the calculated result)
                const parcelaComAdicional = parcela as ParcelaComAdicional;
                const hasAplicada = (parcelaComAdicional.amortizacaoAdicional ?? 0) > 0;

                // Calculate prestação líquida (prestação - aluguel) from month 1 onwards
                const aluguelNoMes = hasAluguel
                  ? getAluguelCorrigidoNoMes(parcela.mes, aluguelMensal, correcaoAnualAluguel)
                  : 0;
                const prestacaoLiquida = parcela.prestacao - aluguelNoMes;

                return (
                  <TableRow key={parcela.mes} className={hasAplicada ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""}>
                    <TableCell
                      className={`text-center font-medium sticky left-0 z-10 ${
                        hasAplicada ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-background"
                      }`}>
                      {parcela.mes}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      {formatCurrency(parcela.saldoInicial)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600 dark:text-red-400">
                      {formatCurrency(parcela.jurosPago)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(parcela.amortizacao)}
                      {hasAplicada && (
                        <span className="block text-xs text-blue-600 dark:text-blue-400">
                          +{formatCurrency(parcelaComAdicional.amortizacaoAdicional)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(parcela.prestacao)}
                    </TableCell>
                    {hasAluguel && (
                      <TableCell className="text-right font-mono text-sm">
                        <div className="flex flex-col items-end">
                          <span
                            className={
                              prestacaoLiquida < 0
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : prestacaoLiquida === 0
                                ? "text-muted-foreground"
                                : ""
                            }>
                            {formatCurrency(prestacaoLiquida)}
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">
                            -{formatCurrency(aluguelNoMes)}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(parcela.saldoDevedor)}
                    </TableCell>
                    {onAmortizacaoChange && (
                      <TableCell className="text-center p-1">
                        <AmortizacaoPopover
                          mes={parcela.mes}
                          currentValue={amortAdicional?.valor ?? 0}
                          currentTipo={amortAdicional?.tipo ?? "prazo"}
                          onSave={handleSave}
                          onRemove={handleRemove}>
                          {hasExtraValue ? (
                            // Badge for existing amortization
                            <button
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                              title={t("actions.editExtra")}>
                              <span className="font-mono">+{formatCurrency(amortAdicional!.valor)}</span>
                              {amortAdicional!.tipo === "prazo" ? (
                                <Clock className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )}
                              <Pencil className="h-2.5 w-2.5 opacity-60" />
                            </button>
                          ) : (
                            // Add button for empty rows
                            <button
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              title={t("actions.addExtra")}>
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </AmortizacaoPopover>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Toggle button for showing all/less */}
        {parcelas.length > 24 && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  {t("toggle.showLess")}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  {t("toggle.showAll", { count: parcelas.length })}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Mobile scroll hint */}
        <div className="sm:hidden mt-2 px-4 text-xs text-muted-foreground text-center">{t("mobileHint")}</div>

        {hasAdicionais && (
          <div className="mt-4 mx-4 sm:mx-0 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-sm text-emerald-800 dark:text-emerald-200">
            {t.rich("tip", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </div>
        )}

        {/* Legend */}
        {hasAluguel && (
          <div className="mt-4 mx-4 sm:mx-0 p-4 bg-muted/30 rounded-lg text-sm">
            <p className="font-medium text-muted-foreground mb-2">{t("legend.title")}</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900" />
                <span>{t("legend.netPayment")}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
