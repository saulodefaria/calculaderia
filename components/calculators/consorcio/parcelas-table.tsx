"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, ArrowDown, Clock, TrendingUp, Gift } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import type {
  ParcelaConsorcio,
  ParcelaConsorcioComAdicional,
  AmortizacaoAdicionalConsorcio,
  TipoAmortizacaoAdicional,
  InputsConsorcio,
} from "@/lib/calculators/consorcio";

interface ParcelasTableProps {
  parcelas: ParcelaConsorcio[] | ParcelaConsorcioComAdicional[];
  amortizacoesAdicionais?: AmortizacaoAdicionalConsorcio[];
  onAmortizacaoChange?: (mes: number, valor: number, tipo: TipoAmortizacaoAdicional) => void;
  inputs?: InputsConsorcio | null;
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
          <h4 className="font-medium text-sm">Amortização Extra - Mês {mes}</h4>

          <div className="space-y-2">
            <Label htmlFor={`valor-${mes}`} className="text-xs">
              Valor
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id={`valor-${mes}`}
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={inputValue}
                onChange={(e) => setInputValue(formatCurrencyInput(e.target.value))}
                className="pl-10 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Tipo de Amortização</Label>
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
                <span className="text-xs font-medium">Prazo</span>
                <span className="text-[10px] text-muted-foreground text-center">Terminar antes</span>
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
                <span className="text-xs font-medium">Parcela</span>
                <span className="text-[10px] text-muted-foreground text-center">Pagar menos</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {currentValue > 0 && (
              <Button variant="outline" size="sm" className="text-red-600" onClick={handleRemove}>
                Remover
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={parseCurrencyValue(inputValue) === 0}>
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ParcelasTable({
  parcelas,
  amortizacoesAdicionais = [],
  onAmortizacaoChange,
  inputs,
}: ParcelasTableProps) {
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

  // Lance info from inputs
  const mesContemplacao = inputs?.lance?.mes ?? 0;
  const valorLance = inputs?.lance?.valor ?? 0;
  const hasLance = valorLance > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tabela de Parcelas</CardTitle>
        {onAmortizacaoChange ? (
          <p className="text-sm text-muted-foreground">
            Clique no botão <Plus className="inline h-3 w-3" /> em qualquer mês para adicionar uma amortização extra
            (lance).
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            As linhas destacadas indicam os meses onde a correção anual foi aplicada.
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <Table className="min-w-[700px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 bg-background z-20">Mês</TableHead>
                <TableHead className="text-right whitespace-nowrap">Fundo Comum</TableHead>
                <TableHead className="text-right whitespace-nowrap">Taxa Admin.</TableHead>
                <TableHead className="text-right">Parcela</TableHead>
                <TableHead className="text-right whitespace-nowrap">Saldo Bem</TableHead>
                <TableHead className="w-20 text-center">Correção</TableHead>
                {onAmortizacaoChange && (
                  <TableHead className="w-10 text-center">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcelas.map((parcela) => {
                const amortAdicional = amortizacoesAdicionais.find((a) => a.mes === parcela.mes);
                const hasExtraValue = (amortAdicional?.valor ?? 0) > 0;
                const hasCorrection = parcela.correcaoAplicada > 0;

                // Check if this row has additional amortization applied (in the calculated result)
                const parcelaComAdicional = parcela as ParcelaConsorcioComAdicional;
                const hasAplicada = (parcelaComAdicional.amortizacaoAdicional ?? 0) > 0;

                // Check if this is the contemplation month (with lance)
                const isContemplacao = hasLance && parcela.mes === mesContemplacao;

                // Determine row highlight: purple for contemplation, green for amortization, amber for correction
                let rowClass = "";
                let cellClass = "bg-background";

                if (isContemplacao) {
                  rowClass = "bg-purple-50/50 dark:bg-purple-950/20 ring-1 ring-purple-300 dark:ring-purple-700";
                  cellClass = "bg-purple-50 dark:bg-purple-950/40";
                } else if (hasAplicada) {
                  rowClass = "bg-emerald-50/50 dark:bg-emerald-950/20";
                  cellClass = "bg-emerald-50 dark:bg-emerald-950/40";
                } else if (hasCorrection) {
                  rowClass = "bg-amber-50/50 dark:bg-amber-950/20";
                  cellClass = "bg-amber-50 dark:bg-amber-950/40";
                }

                return (
                  <TableRow key={parcela.mes} className={rowClass}>
                    <TableCell className={`text-center font-medium sticky left-0 z-10 ${cellClass}`}>
                      <div className="flex items-center justify-center gap-1">
                        {parcela.mes}
                        {isContemplacao && <Gift className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      {formatCurrency(parcela.fundoComum)}
                      {hasAplicada && (
                        <span className="block text-xs text-blue-600 dark:text-blue-400">
                          +{formatCurrency(parcelaComAdicional.amortizacaoAdicional)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600 dark:text-red-400">
                      {formatCurrency(parcela.taxaAdministracao)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      <div className="flex flex-col items-end">
                        <span>{formatCurrency(parcela.parcela)}</span>
                        {isContemplacao && valorLance > 0 && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">
                            Lance: {formatCurrency(valorLance)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(parcela.saldoDevedor)}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasCorrection ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          <TrendingUp className="h-3 w-3" />+{parcela.correcaoAplicada.toFixed(1).replace(".", ",")}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
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
                              title="Editar amortização extra">
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
                              title="Adicionar amortização extra">
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
        {/* Mobile scroll hint */}
        <div className="sm:hidden mt-2 px-4 text-xs text-muted-foreground text-center">
          ← Deslize para ver mais colunas →
        </div>

        {hasAdicionais && (
          <div className="mt-4 mx-4 sm:mx-0 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-sm text-emerald-800 dark:text-emerald-200">
            <strong>Dica:</strong> As linhas destacadas em verde mostram os meses onde foram aplicadas amortizações
            adicionais. Clique no badge para editar ou remover.
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 mx-4 sm:mx-0 p-4 bg-muted/30 rounded-lg text-sm space-y-2">
          <p className="font-medium text-muted-foreground">Legenda:</p>
          <div className="flex flex-wrap gap-4 text-xs">
            {hasLance && (
              <div className="flex items-center gap-2">
                <Gift className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                <span>Mês de contemplação (lance)</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900" />
              <span>Correção anual aplicada</span>
            </div>
            {hasAdicionais && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900" />
                <span>Amortização adicional aplicada</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
