"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Copy,
  Download,
  FileUp,
  RotateCcw,
  ShieldCheck,
  Table2,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  CSV_JSON_MAX_INPUT_LENGTH,
  buildCsvJsonSearchParams,
  buildCsvJsonShareUrl,
  getCsvJsonDelimiterCharacter,
  processCsvJsonConverter,
  readCsvJsonContentFromFragment,
  readCsvJsonStateFromParams,
  type CsvJsonDelimiterOption,
  type CsvJsonEmptyLineMode,
  type CsvJsonHeaderMode,
  type CsvJsonIndent,
  type CsvJsonMode,
  type CsvJsonOutputShape,
  type CsvJsonResult,
  type CsvJsonState,
  type CsvJsonTypeMode,
} from "@/lib/tools/csv-json";
import { cn } from "@/lib/utils/index";

const editorClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-72 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const modeIds = ["csvParaJson", "jsonParaCsv"] as const;
const delimiterIds = ["auto", "virgula", "pontoEVirgula", "tab", "pipe"] as const;
const headerModeIds = ["primeiraLinha", "semCabecalho"] as const;
const outputShapeIds = ["objetos", "arrays"] as const;
const typeModeIds = ["strings", "inferir"] as const;
const emptyLineModeIds = ["ignorar", "preservar"] as const;
const indentIds = ["2", "4", "compacto"] as const;
const faqIds = ["privacy", "delimiter", "headers", "strings", "nested", "formula", "sharing"] as const;
const seoDetailIds = ["conversion", "headers", "delimiters", "types", "jsonCsv", "privacy"] as const;

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getMetricsRows(result: CsvJsonResult) {
  return [
    ["rows", result.metrics.rows],
    ["columns", result.metrics.columns],
    ["warnings", result.metrics.warnings],
    ["inputCharacters", result.metrics.inputCharacters],
    ["inputBytes", result.metrics.inputBytes],
    ["outputCharacters", result.metrics.outputCharacters],
    ["outputBytes", result.metrics.outputBytes],
  ] as const;
}

export function CsvJsonConverterClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.conversor-csv-json.form");
  const tFaq = useTranslations("tools.conversor-csv-json.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<CsvJsonState>(() =>
    readCsvJsonStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"result" | "diagnostics" | null>(null);
  const [fileStatus, setFileStatus] = useState<"idle" | "loaded" | "tooLarge" | "readFailed">("idle");

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const result = useMemo(() => processCsvJsonConverter(state), [state]);
  const liveParams = useMemo(
    () =>
      buildCsvJsonSearchParams({
        input: "",
        mode: state.mode,
        delimiter: state.delimiter,
        headerMode: state.headerMode,
        outputShape: state.outputShape,
        typeMode: state.typeMode,
        emptyLineMode: state.emptyLineMode,
        jsonIndent: state.jsonIndent,
        escapeFormulas: state.escapeFormulas,
      }).params,
    [
      state.delimiter,
      state.emptyLineMode,
      state.escapeFormulas,
      state.headerMode,
      state.jsonIndent,
      state.mode,
      state.outputShape,
      state.typeMode,
    ]
  );
  const statusDescription =
    result.status === "valid"
      ? t("result.validDescription", {
          rows: numberFormatter.format(result.rows),
          columns: numberFormatter.format(result.columns),
          delimiter: result.detectedDelimiter ? t(`delimiters.${result.detectedDelimiter}`) : t("delimiters.auto"),
        })
      : result.status === "tooLarge"
        ? t("result.tooLargeDescription", { limit: numberFormatter.format(CSV_JSON_MAX_INPUT_LENGTH) })
        : result.status === "empty"
          ? t("result.emptyDescription")
          : t("result.invalidDescription");
  const diagnosticText = useMemo(
    () =>
      [
        t(`result.status.${result.status}`),
        ...result.errors.map((error) =>
          [
            error.code,
            t(`errors.${error.code}`),
            typeof error.row === "number"
              ? t("errors.location", {
                  row: numberFormatter.format(error.row),
                  column: typeof error.column === "number" ? numberFormatter.format(error.column) : "-",
                })
              : "",
            error.message ? t("errors.engine", { message: error.message }) : "",
          ]
            .filter(Boolean)
            .join(" ")
        ),
        ...result.warnings.map((warning) =>
          [
            warning.code,
            t(`warnings.${warning.code}`, {
              count: numberFormatter.format(warning.count ?? 0),
              delimiter: warning.delimiter ? t(`delimiters.${warning.delimiter}`) : "",
            }),
          ].join(" ")
        ),
      ].join("\n"),
    [numberFormatter, result.errors, result.status, result.warnings, t]
  );

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readCsvJsonContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        input: contentFragment.input,
      }));
      setIncludeContentInUrl(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateState = (patch: Partial<CsvJsonState>) => {
    setShareContentOmitted(false);
    setFileStatus("idle");
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "result" | "diagnostics") => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setShareContentOmitted(false);

    if (!file) return;

    if (file.size > CSV_JSON_MAX_INPUT_LENGTH) {
      setFileStatus("tooLarge");
      return;
    }

    try {
      const text = await file.text();
      setFileStatus("loaded");
      setState((current) => ({
        ...current,
        input: text,
      }));
    } catch {
      setFileStatus("readFailed");
    }
  };

  const clearInput = () => {
    setFileStatus("idle");
    updateState({ input: "" });
  };

  const loadExample = () => {
    setFileStatus("idle");
    updateState({
      input:
        state.mode === "csvParaJson"
          ? 'nome,email,ativo\nAna,ana@example.com,true\nBia,bia@example.com,false\n"Cafe, especial",cafe@example.com,true'
          : JSON.stringify(
              [
                { nome: "Ana", email: "ana@example.com", ativo: true },
                { nome: "Bia", email: "bia@example.com", tags: ["cliente", "beta"] },
              ],
              null,
              2
            ),
    });
  };

  const useOutputAsInput = () => {
    if (!result.output) return;

    setFileStatus("idle");
    updateState({ input: result.output });
  };

  const swapOutputIntoInput = () => {
    if (!result.output) return;

    setFileStatus("idle");
    updateState({
      input: result.output,
      mode: state.mode === "csvParaJson" ? "jsonParaCsv" : "csvParaJson",
      delimiter:
        state.delimiter === "auto" && result.detectedDelimiter ? result.detectedDelimiter : state.delimiter,
    });
  };

  const downloadOutput = () => {
    if (!result.output) return;

    const isJson = state.mode === "csvParaJson";
    downloadBlob(
      new Blob([result.output], {
        type: isJson ? "application/json;charset=utf-8" : "text/csv;charset=utf-8",
      }),
      isJson ? "conversor-csv-json.json" : "conversor-csv-json.csv"
    );
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
            <div className="space-y-6">
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="csv-json-input-title">
                <div>
                  <h2 id="csv-json-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv-json-input">{t("input.label")}</Label>
                  <textarea
                    id="csv-json-input"
                    data-testid="csv-json-input"
                    className={editorClassName}
                    value={state.input}
                    onChange={(event) => updateState({ input: event.target.value })}
                    placeholder={state.mode === "csvParaJson" ? t("input.csvPlaceholder") : t("input.jsonPlaceholder")}
                    spellCheck={false}
                    aria-invalid={result.status === "invalidCsv" || result.status === "invalidJson" || result.status === "tooLarge"}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="space-y-1">
                    <Label htmlFor="csv-json-file" className="inline-flex items-center gap-2">
                      <FileUp className="h-4 w-4" />
                      {t("file.label")}
                    </Label>
                    <input
                      id="csv-json-file"
                      data-testid="csv-json-file"
                      type="file"
                      accept=".csv,.txt,.json,text/csv,application/json,text/plain"
                      onChange={handleFileChange}
                      className="block w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-sm file:font-medium"
                    />
                    <p
                      className={cn(
                        "text-xs",
                        fileStatus === "tooLarge" || fileStatus === "readFailed"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                      data-testid="csv-json-file-status">
                      {t(`file.${fileStatus}`)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <Button type="button" variant="outline" onClick={clearInput} disabled={!state.input} data-testid="csv-json-clear">
                      <Trash2 className="h-4 w-4" />
                      {t("actions.clear")}
                    </Button>
                    <Button type="button" variant="outline" onClick={loadExample} data-testid="csv-json-example">
                      <Wand2 className="h-4 w-4" />
                      {t("actions.loadExample")}
                    </Button>
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="csv-json-options-title">
                <div>
                  <h2 id="csv-json-options-title" className="font-semibold">
                    {t("options.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("options.description")}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t("modes.label")}</Label>
                  <Tabs
                    value={state.mode}
                    onValueChange={(value) => updateState({ mode: value as CsvJsonMode })}
                    data-testid="csv-json-mode-selector">
                    <TabsList className="grid h-auto w-full grid-cols-2">
                      {modeIds.map((mode) => (
                        <TabsTrigger key={mode} value={mode} data-testid={`csv-json-mode-${mode}`}>
                          {t(`modes.${mode}`)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <fieldset className="space-y-2" data-testid="csv-json-delimiter-selector">
                  <legend className="text-sm font-medium">{t("delimiters.label")}</legend>
                  <div className="grid gap-2 sm:grid-cols-5">
                    {delimiterIds.map((delimiter) => (
                      <Button
                        key={delimiter}
                        type="button"
                        variant={state.delimiter === delimiter ? "default" : "outline"}
                        onClick={() => updateState({ delimiter: delimiter as CsvJsonDelimiterOption })}
                        aria-pressed={state.delimiter === delimiter}
                        data-testid={`csv-json-delimiter-${delimiter}`}
                        className="h-auto min-h-10 w-full whitespace-normal px-2 text-center">
                        {t(`delimiters.${delimiter}`)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="csv-json-delimiter-note">
                    {state.delimiter === "auto"
                      ? t("delimiters.autoDescription")
                      : t("delimiters.selectedDescription", {
                          delimiter: getCsvJsonDelimiterCharacter(state.delimiter),
                        })}
                  </p>
                </fieldset>

                {state.mode === "csvParaJson" ? (
                  <div className="grid gap-4">
                    <fieldset className="space-y-2" data-testid="csv-json-header-selector">
                      <legend className="text-sm font-medium">{t("csvOptions.headerMode")}</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {headerModeIds.map((headerMode) => (
                          <Button
                            key={headerMode}
                            type="button"
                            variant={state.headerMode === headerMode ? "default" : "outline"}
                            onClick={() => updateState({ headerMode: headerMode as CsvJsonHeaderMode })}
                            aria-pressed={state.headerMode === headerMode}
                            data-testid={`csv-json-header-${headerMode}`}
                            className="w-full">
                            {t(`headerModes.${headerMode}`)}
                          </Button>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className="space-y-2" data-testid="csv-json-output-shape-selector">
                      <legend className="text-sm font-medium">{t("csvOptions.outputShape")}</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {outputShapeIds.map((outputShape) => (
                          <Button
                            key={outputShape}
                            type="button"
                            variant={state.outputShape === outputShape ? "default" : "outline"}
                            onClick={() => updateState({ outputShape: outputShape as CsvJsonOutputShape })}
                            aria-pressed={state.outputShape === outputShape}
                            data-testid={`csv-json-output-shape-${outputShape}`}
                            className="w-full">
                            {t(`outputShapes.${outputShape}`)}
                          </Button>
                        ))}
                      </div>
                    </fieldset>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <fieldset className="space-y-2" data-testid="csv-json-type-selector">
                        <legend className="text-sm font-medium">{t("csvOptions.types")}</legend>
                        <div className="grid gap-2">
                          {typeModeIds.map((typeMode) => (
                            <Button
                              key={typeMode}
                              type="button"
                              variant={state.typeMode === typeMode ? "default" : "outline"}
                              onClick={() => updateState({ typeMode: typeMode as CsvJsonTypeMode })}
                              aria-pressed={state.typeMode === typeMode}
                              data-testid={`csv-json-types-${typeMode}`}
                              className="w-full">
                              {t(`typeModes.${typeMode}`)}
                            </Button>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="space-y-2" data-testid="csv-json-empty-line-selector">
                        <legend className="text-sm font-medium">{t("csvOptions.emptyLines")}</legend>
                        <div className="grid gap-2">
                          {emptyLineModeIds.map((emptyLineMode) => (
                            <Button
                              key={emptyLineMode}
                              type="button"
                              variant={state.emptyLineMode === emptyLineMode ? "default" : "outline"}
                              onClick={() => updateState({ emptyLineMode: emptyLineMode as CsvJsonEmptyLineMode })}
                              aria-pressed={state.emptyLineMode === emptyLineMode}
                              data-testid={`csv-json-empty-lines-${emptyLineMode}`}
                              className="w-full">
                              {t(`emptyLineModes.${emptyLineMode}`)}
                            </Button>
                          ))}
                        </div>
                      </fieldset>

                      <fieldset className="space-y-2" data-testid="csv-json-indent-selector">
                        <legend className="text-sm font-medium">{t("csvOptions.indent")}</legend>
                        <div className="grid gap-2">
                          {indentIds.map((indent) => (
                            <Button
                              key={indent}
                              type="button"
                              variant={state.jsonIndent === indent ? "default" : "outline"}
                              onClick={() => updateState({ jsonIndent: indent as CsvJsonIndent })}
                              aria-pressed={state.jsonIndent === indent}
                              data-testid={`csv-json-indent-${indent}`}
                              className="w-full">
                              {t(`indent.${indent}`)}
                            </Button>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-md border bg-background p-3">
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        id="csv-json-escape-formulas"
                        data-testid="csv-json-escape-formulas"
                        type="checkbox"
                        checked={state.escapeFormulas}
                        onChange={(event) => updateState({ escapeFormulas: event.target.checked })}
                        className="mt-1"
                      />
                      <span>{t("jsonOptions.escapeFormulas")}</span>
                    </label>
                    <p className="text-xs text-muted-foreground">{t("jsonOptions.description")}</p>
                  </div>
                )}
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="csv-json-share-title">
                <div>
                  <h2 id="csv-json-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="csv-json-include-content"
                    data-testid="csv-json-include-content"
                    type="checkbox"
                    checked={includeContentInUrl}
                    onChange={(event) => {
                      setShareContentOmitted(false);
                      setIncludeContentInUrl(event.target.checked);
                    }}
                    className="mt-1"
                  />
                  <span>{t("share.includeContent")}</span>
                </label>
                <p
                  className={cn(
                    "text-sm",
                    includeContentInUrl || shareContentOmitted
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground"
                  )}>
                  {shareContentOmitted
                    ? t("share.tooLong")
                    : includeContentInUrl
                      ? t("share.publicWarning")
                      : t("share.safe")}
                </p>
                <div data-testid="csv-json-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildCsvJsonShareUrl(`${window.location.origin}${window.location.pathname}`, state, {
                        includeContent: includeContentInUrl,
                      });
                      setShareContentOmitted(shareUrl.contentOmitted);

                      return shareUrl.url;
                    }}
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="csv-json-results-title">
              <div>
                <h2 id="csv-json-results-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="csv-json-status"
                className={cn(
                  "rounded-md border p-3",
                  result.status === "valid"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
                    : result.status === "invalidCsv" || result.status === "invalidJson" || result.status === "tooLarge"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "bg-background"
                )}>
                <div className="flex items-start gap-2">
                  {result.status === "valid" ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : result.status === "empty" ? (
                    <Table2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{t(`result.status.${result.status}`)}</p>
                    <p className="text-sm opacity-90">{statusDescription}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv-json-output">{t("result.outputLabel")}</Label>
                <textarea
                  id="csv-json-output"
                  data-testid="csv-json-output"
                  className={cn(editorClassName, "min-h-64 bg-background")}
                  value={result.output}
                  readOnly
                  placeholder={t("result.outputPlaceholder")}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.output, "result")}
                  disabled={!result.output}
                  data-testid="csv-json-copy-result">
                  {copied === "result" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "result" ? t("actions.copied") : t("actions.copyResult")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(diagnosticText, "diagnostics")}
                  disabled={result.status === "empty" && result.warnings.length === 0}
                  data-testid="csv-json-copy-diagnostics">
                  {copied === "diagnostics" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied === "diagnostics" ? t("actions.copied") : t("actions.copyDiagnostics")}
                </Button>
                <Button type="button" variant="outline" onClick={downloadOutput} disabled={!result.output} data-testid="csv-json-download">
                  <Download className="h-4 w-4" />
                  {state.mode === "csvParaJson" ? t("actions.downloadJson") : t("actions.downloadCsv")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={useOutputAsInput}
                  disabled={!result.output}
                  data-testid="csv-json-use-output">
                  <RotateCcw className="h-4 w-4" />
                  {t("actions.useOutput")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={swapOutputIntoInput}
                  disabled={!result.output}
                  data-testid="csv-json-swap-output"
                  className="sm:col-span-2">
                  <RotateCcw className="h-4 w-4" />
                  {t("actions.swapOutput")}
                </Button>
              </div>

              <div className="rounded-md border bg-background p-3" data-testid="csv-json-metrics">
                <h3 className="font-medium">{t("metrics.title")}</h3>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {getMetricsRows(result).map(([key, value]) => (
                    <div key={key} className="rounded-md bg-muted/60 p-2">
                      <dt className="text-muted-foreground">{t(`metrics.${key}`)}</dt>
                      <dd className="font-semibold">{numberFormatter.format(value)}</dd>
                    </div>
                  ))}
                  <div className="rounded-md bg-muted/60 p-2">
                    <dt className="text-muted-foreground">{t("metrics.delimiter")}</dt>
                    <dd className="font-semibold" data-testid="csv-json-detected-delimiter">
                      {result.detectedDelimiter ? t(`delimiters.${result.detectedDelimiter}`) : "-"}
                    </dd>
                  </div>
                </dl>
              </div>

              {result.preview.rows.length > 0 ? (
                <div className="overflow-hidden rounded-md border bg-background" data-testid="csv-json-preview">
                  <div className="border-b p-3">
                    <h3 className="font-medium">{t("preview.title")}</h3>
                    <p className="text-xs text-muted-foreground">{t("preview.description")}</p>
                  </div>
                  <div className="max-h-72 overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          {result.preview.headers.map((header) => (
                            <th key={header} className="border-b px-3 py-2 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.preview.rows.map((row, rowIndex) => (
                          <tr key={`row-${rowIndex}`}>
                            {row.map((cell, cellIndex) => (
                              <td key={`${rowIndex}-${cellIndex}`} className="max-w-56 break-words border-b px-3 py-2 align-top">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {result.warnings.length > 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  <h3 className="font-medium">{t("warnings.title")}</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {result.warnings.map((warning) => (
                      <li key={`${warning.code}-${warning.count ?? 0}`} data-testid={`csv-json-warning-${warning.code}`}>
                        {t(`warnings.${warning.code}`, {
                          count: numberFormatter.format(warning.count ?? 0),
                          delimiter: warning.delimiter ? t(`delimiters.${warning.delimiter}`) : "",
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.errors.length > 0 ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive" data-testid="csv-json-error">
                  <h3 className="font-medium">{t("errors.title")}</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {result.errors.map((error, index) => (
                      <li key={`${error.code}-${index}`}>
                        <span>{t(`errors.${error.code}`)}</span>
                        {typeof error.row === "number" ? (
                          <span>
                            {" "}
                            {t("errors.location", {
                              row: numberFormatter.format(error.row),
                              column: typeof error.column === "number" ? numberFormatter.format(error.column) : "-",
                            })}
                          </span>
                        ) : null}
                        {error.message ? <span> {t("errors.engine", { message: error.message })}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 grid gap-4 md:grid-cols-3" aria-labelledby="csv-json-details-title">
        <h2 id="csv-json-details-title" className="sr-only">
          {t("seoDetails.title")}
        </h2>
        {seoDetailIds.map((detailId) => (
          <div key={detailId} className="rounded-lg border p-4">
            <h3 className="font-semibold">{t(`seoDetails.${detailId}.title`)}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t(`seoDetails.${detailId}.description`)}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border p-4" aria-labelledby="csv-json-faq-title">
        <h2 id="csv-json-faq-title" className="text-xl font-semibold">
          {tFaq("title")}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {faqIds.map((faqId) => (
            <div key={faqId}>
              <h3 className="font-medium">{tFaq(`${faqId}.question`)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tFaq(`${faqId}.answer`)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
