"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Code2,
  Copy,
  Fingerprint,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  JWT_DECODER_MAX_INPUT_LENGTH,
  JWT_DECODER_SAFE_EXAMPLE_TOKEN,
  buildJwtDecoderDiagnosticSummary,
  buildJwtDecoderSearchParams,
  buildJwtDecoderShareUrl,
  processJwtDecoder,
  readJwtDecoderStateFromUrl,
  shouldSanitizeJwtDecoderUrl,
  type JwtDecoderState,
  type JwtTimeClaimRow,
} from "@/lib/tools/jwt";
import { cn } from "@/lib/utils/index";

const editorClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-64 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const faqIds = ["privacy", "verification", "parts", "numericDate", "algNone", "jwe", "sharing"] as const;
const relatedLinks = [
  { id: "dev", href: "/dev" },
  { id: "base64", href: "/dev/conversor-base64" },
  { id: "json", href: "/dev/formatador-json" },
  { id: "regex", href: "/dev/regex-tester" },
] as const;

function getPartLengthRows(result: ReturnType<typeof processJwtDecoder>) {
  return result.parts.map((part, index) => ({
    key: `${part.name}-${index}`,
    id: part.name,
    encodedLength: part.encodedLength,
    decodedByteLength: part.decodedByteLength,
    isEmpty: part.isEmpty,
  }));
}

function formatLocalDate(locale: string, isoUtc: string | null) {
  if (!isoUtc) return "";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoUtc));
}

export function JwtDecoderClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.jwt-decoder.form");
  const tFaq = useTranslations("tools.jwt-decoder.faq");
  const [state, setState] = useState<JwtDecoderState>(() =>
    readJwtDecoderStateFromUrl(new URLSearchParams(searchParams.toString()))
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [copied, setCopied] = useState<"header" | "payload" | "diagnostics" | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const result = useMemo(() => processJwtDecoder(state, { nowMs }), [nowMs, state]);
  const diagnosticSummary = useMemo(() => buildJwtDecoderDiagnosticSummary(result), [result]);
  const structureRows = useMemo(() => getPartLengthRows(result), [result]);

  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);

    if (shouldSanitizeJwtDecoderUrl(currentParams, window.location.hash)) {
      replaceQueryString(buildJwtDecoderSearchParams());
    }
  }, []);

  const updateState = (patch: Partial<JwtDecoderState>) => {
    setCopied(null);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "header" | "payload" | "diagnostics") => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusDescription =
    result.status === "valid"
      ? t("result.validDescription")
      : result.status === "unsupportedJwe"
        ? t("result.unsupportedJweDescription")
        : result.status === "tooLarge"
          ? t("result.tooLargeDescription", {
              limit: numberFormatter.format(JWT_DECODER_MAX_INPUT_LENGTH),
            })
          : result.status === "empty"
            ? t("result.emptyDescription")
            : t("result.invalidDescription");

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
            <div className="space-y-6">
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="jwt-decoder-input-title">
                <div>
                  <h2 id="jwt-decoder-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jwt-decoder-token">{t("input.label")}</Label>
                  <textarea
                    id="jwt-decoder-token"
                    data-testid="jwt-decoder-token"
                    className={editorClassName}
                    value={state.token}
                    onChange={(event) => updateState({ token: event.target.value })}
                    placeholder={t("input.placeholder")}
                    spellCheck={false}
                    aria-invalid={result.status !== "empty" && result.status !== "valid" && result.status !== "unsupportedJwe"}
                  />
                  <p className="text-xs leading-relaxed text-muted-foreground">{t("input.warning")}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ token: JWT_DECODER_SAFE_EXAMPLE_TOKEN })}
                    data-testid="jwt-decoder-example">
                    <Fingerprint className="h-4 w-4" />
                    {t("actions.loadExample")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ token: "" })}
                    disabled={!state.token}
                    data-testid="jwt-decoder-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNowMs(Date.now())}
                    data-testid="jwt-decoder-refresh-now">
                    <RefreshCw className="h-4 w-4" />
                    {t("actions.refreshNow")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="jwt-decoder-share-title">
                <div>
                  <h2 id="jwt-decoder-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <p className="text-sm text-muted-foreground">{t("share.safe")}</p>
                <div data-testid="jwt-decoder-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => buildJwtDecoderShareUrl(`${window.location.origin}${window.location.pathname}`)}
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="jwt-decoder-results">
              <div>
                <h2 id="jwt-decoder-results" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="jwt-decoder-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "valid" ? "border-emerald-200" : "",
                  result.status !== "empty" && result.status !== "valid" ? "border-amber-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  {result.status === "valid" ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : result.status === "empty" ? (
                    <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{t(`result.status.${result.status}`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{statusDescription}</p>
                  </div>
                </div>
              </div>

              <section
                className="space-y-3 rounded-lg border bg-background p-4"
                aria-labelledby="jwt-decoder-structure-title"
                data-testid="jwt-decoder-structure">
                <h3 id="jwt-decoder-structure-title" className="font-medium">
                  {t("structure.title")}
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between gap-3">
                    <span>{t("structure.tokenKind")}</span>
                    <span className="font-medium">{t(`tokenKinds.${result.tokenKind}`)}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>{t("structure.partCount")}</span>
                    <span className="font-medium tabular-nums">{numberFormatter.format(result.partCount)}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>{t("structure.algorithm")}</span>
                    <span className="min-w-0 break-words text-right font-medium">
                      {result.algorithmInfo.value ?? t("structure.unknown")}
                    </span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>{t("structure.algorithmFamily")}</span>
                    <span className="font-medium">{t(`algorithmFamilies.${result.algorithmInfo.family}`)}</span>
                  </p>
                </div>
                {structureRows.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    {structureRows.map((row) => (
                      <div key={row.key} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">{t(`parts.${row.id}`)}</p>
                        <p className="mt-1 text-muted-foreground">
                          {t("structure.partLengths", {
                            encoded: numberFormatter.format(row.encodedLength),
                            decoded:
                              row.decodedByteLength === null
                                ? t("structure.notDecoded")
                                : numberFormatter.format(row.decodedByteLength),
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              {result.error ? (
                <section
                  className="space-y-3 rounded-lg border border-amber-300 bg-background p-4"
                  aria-labelledby="jwt-decoder-error-title"
                  data-testid="jwt-decoder-error">
                  <h3 id="jwt-decoder-error-title" className="font-medium">
                    {t("errors.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(`errors.${result.error.code}`, { part: t(`parts.${result.error.part}`) })}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(diagnosticSummary, "diagnostics")}
                    className="w-full"
                    data-testid="jwt-decoder-copy-diagnostics-error">
                    {copied === "diagnostics" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                    {copied === "diagnostics" ? t("actions.copied") : t("actions.copyDiagnostics")}
                  </Button>
                </section>
              ) : null}

              {result.warnings.length > 0 ? (
                <section
                  className="space-y-2 rounded-lg border border-amber-300 bg-background p-4"
                  aria-labelledby="jwt-decoder-warnings-title"
                  data-testid="jwt-decoder-warnings">
                  <h3 id="jwt-decoder-warnings-title" className="font-medium">
                    {t("warnings.title")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.warnings.map((warning) => (
                      <span
                        key={warning}
                        data-testid={`jwt-decoder-warning-${warning}`}
                        className="rounded-full border border-amber-300 px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
                        {t(`warnings.${warning}`)}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>
          </div>

          {result.headerJson || result.payloadJson ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {result.headerJson ? (
                <section className="space-y-3 rounded-lg border p-4" aria-labelledby="jwt-decoder-header-title">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 id="jwt-decoder-header-title" className="font-semibold">
                      {t("json.headerTitle")}
                    </h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.formattedHeader, "header")}
                      data-testid="jwt-decoder-copy-header">
                      {copied === "header" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied === "header" ? t("actions.copied") : t("actions.copyHeader")}
                    </Button>
                  </div>
                  <pre
                    data-testid="jwt-decoder-header-output"
                    className="max-h-96 min-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 font-mono text-sm">
                    {result.formattedHeader}
                  </pre>
                </section>
              ) : null}

              {result.payloadJson ? (
                <section className="space-y-3 rounded-lg border p-4" aria-labelledby="jwt-decoder-payload-title">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 id="jwt-decoder-payload-title" className="font-semibold">
                      {t("json.payloadTitle")}
                    </h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.formattedPayload, "payload")}
                      data-testid="jwt-decoder-copy-payload">
                      {copied === "payload" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied === "payload" ? t("actions.copied") : t("actions.copyPayload")}
                    </Button>
                  </div>
                  <pre
                    data-testid="jwt-decoder-payload-output"
                    className="max-h-96 min-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 font-mono text-sm">
                    {result.formattedPayload}
                  </pre>
                </section>
              ) : null}
            </div>
          ) : null}

          {result.registeredClaims.length > 0 ? (
            <section className="space-y-3 rounded-lg border p-4" aria-labelledby="jwt-decoder-claims-title">
              <h2 id="jwt-decoder-claims-title" className="font-semibold">
                {t("claims.title")}
              </h2>
              <div className="grid gap-3" data-testid="jwt-decoder-claim-table">
                {result.registeredClaims.map((claim) => (
                  <div key={claim.claim} className="grid gap-2 rounded-md border p-3 md:grid-cols-[7rem_minmax(0,1fr)]">
                    <div>
                      <p className="font-mono text-sm font-semibold">{claim.claim}</p>
                      <p className="text-xs text-muted-foreground">{t(`claims.kinds.${claim.valueKind}`)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-mono text-sm">{claim.rawValue}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t(`claims.descriptions.${claim.claim}`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3 rounded-lg border p-4" aria-labelledby="jwt-decoder-time-title">
            <h2 id="jwt-decoder-time-title" className="font-semibold">
              {t("time.title")}
            </h2>
            {result.timeClaims.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3" data-testid="jwt-decoder-time-status">
                {result.timeClaims.map((timeClaim: JwtTimeClaimRow) => (
                  <div key={timeClaim.claim} className="rounded-md border p-3">
                    <p className="font-mono text-sm font-semibold">{timeClaim.claim}</p>
                    <p className="mt-1 text-sm font-medium">{t(`time.status.${timeClaim.status}`)}</p>
                    {timeClaim.isoUtc ? (
                      <p className="mt-2 break-words text-xs text-muted-foreground">
                        {timeClaim.isoUtc}
                        <br />
                        {formatLocalDate(locale, timeClaim.isoUtc)}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">{t("time.invalidValue")}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="jwt-decoder-time-status">
                {t("time.empty")}
              </p>
            )}
          </section>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => copyToClipboard(diagnosticSummary, "diagnostics")}
              disabled={result.status === "empty"}
              data-testid="jwt-decoder-copy-diagnostics">
              {copied === "diagnostics" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
              {copied === "diagnostics" ? t("actions.copied") : t("actions.copyDiagnostics")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="jwt-decoder-seo-details">
        <h2 id="jwt-decoder-seo-details" className="text-2xl font-semibold tracking-tight">
          {t("seoDetails.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.decodeTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.decodeDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.verifyTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.verifyDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.claimsTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.claimsDescription")}</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="jwt-decoder-related">
        <h2 id="jwt-decoder-related" className="text-2xl font-semibold tracking-tight">
          {t("related.title")}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {relatedLinks.map((item) => (
            <Button key={item.href} asChild variant="outline" size="sm">
              <Link href={item.href}>{t(`related.links.${item.id}`)}</Link>
            </Button>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="jwt-decoder-faq">
        <h2 id="jwt-decoder-faq" className="text-2xl font-semibold tracking-tight">
          {tFaq("title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {faqIds.map((faqId) => (
            <div key={faqId} className="space-y-2">
              <h3 className="font-semibold">{tFaq(`${faqId}.question`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{tFaq(`${faqId}.answer`)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
