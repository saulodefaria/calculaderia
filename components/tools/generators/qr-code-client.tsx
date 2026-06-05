"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Download, Info, ShieldAlert } from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareButton } from "@/components/ui/share-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitialSearchParams, getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";
import {
  QR_MARGIN_MAX,
  QR_SIZE_MAX,
  QR_SIZE_MIN,
  QR_TEXT_BYTE_LIMIT,
  buildQrCodeSearchParams,
  buildQrPayload,
  getUtf8ByteLength,
  normalizeQrStyleOptions,
  readQrCodeStateFromParams,
  type QrCodeFormState,
  type QrCodeMode,
  type QrErrorCorrectionLevel,
  type QrStyleOptions,
  type QrWifiEncryption,
} from "@/lib/tools/qr-code";
import { cn } from "@/lib/utils/index";

const textareaClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-32 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:text-sm";

type QrCodeStatePatch = Omit<Partial<QrCodeFormState>, "style" | "wifi"> & {
  style?: Partial<QrStyleOptions>;
  wifi?: Partial<QrCodeFormState["wifi"]>;
};

function readInitialState() {
  return readQrCodeStateFromParams(getInitialSearchParams());
}

function hasInitialContentSharing() {
  return getInitialSearchParams().get("conteudo") === "1";
}

function downloadUrl(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  URL.revokeObjectURL(url);
}

function getActiveByteLength(state: QrCodeFormState) {
  if (state.mode === "texto") return getUtf8ByteLength(state.text);
  if (state.mode === "pix") return getUtf8ByteLength(state.pix);
  return null;
}

export function QrCodeClient() {
  const t = useTranslations("tools.qr-code.form");
  const [state, setState] = useState<QrCodeFormState>(readInitialState);
  const [includeContentInUrl, setIncludeContentInUrl] = useState(hasInitialContentSharing);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const result = useMemo(() => buildQrPayload(state), [state]);
  const currentParams = useMemo(
    () => buildQrCodeSearchParams(state, { includeContent: includeContentInUrl }),
    [includeContentInUrl, state]
  );
  const activeByteLength = getActiveByteLength(state);
  const errorMessages = result.messages.filter((message) => message.severity === "error");
  const warningMessages = result.messages.filter((message) => message.severity === "warning");
  const showWifiPasswordWarning = state.mode === "wifi" && state.wifi.encryption !== "nopass" && state.wifi.password;

  useEffect(() => {
    replaceQueryString(currentParams);
  }, [currentParams]);

  const updateState = (patch: QrCodeStatePatch) => {
    setState((current) => ({
      ...current,
      ...patch,
      wifi: {
        ...current.wifi,
        ...patch.wifi,
      },
      style: {
        ...current.style,
        ...patch.style,
      },
    }));
  };

  const updateStyle = (patch: Partial<QrStyleOptions>) => {
    setState((current) => ({
      ...current,
      style: normalizeQrStyleOptions({ ...current.style, ...patch }),
    }));
  };

  const handleCopyPayload = async () => {
    if (!result.payload) return;

    await navigator.clipboard.writeText(result.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current || !result.payload) return;

    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const source = new XMLSerializer().serializeToString(clone);
    downloadBlob(new Blob([source], { type: "image/svg+xml;charset=utf-8" }), "qr-code.svg");
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current || !result.payload) return;
    downloadUrl(canvasRef.current.toDataURL("image/png"), "qr-code.png");
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={state.mode} onValueChange={(value) => updateState({ mode: value as QrCodeMode })}>
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4" data-testid="qr-mode-tabs">
            {(["url", "texto", "wifi", "pix"] satisfies QrCodeMode[]).map((mode) => (
              <TabsTrigger key={mode} value={mode} data-testid={`qr-mode-${mode}`}>
                {t(`modes.${mode}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <TabsContent value="url" className="mt-0 space-y-2">
                  <Label htmlFor="qr-url">{t("url.label")}</Label>
                  <Input
                    id="qr-url"
                    data-testid="qr-url-input"
                    inputMode="url"
                    value={state.url}
                    onChange={(event) => updateState({ url: event.target.value })}
                    placeholder={t("url.placeholder")}
                    aria-invalid={errorMessages.some((message) => message.code === "invalidUrl")}
                  />
                  {result.normalizedUrl && result.normalizedUrl !== state.url.trim() ? (
                    <p className="text-xs text-muted-foreground">{t("url.normalized", { value: result.normalizedUrl })}</p>
                  ) : null}
                </TabsContent>

                <TabsContent value="texto" className="mt-0 space-y-2">
                  <Label htmlFor="qr-text">{t("text.label")}</Label>
                  <textarea
                    id="qr-text"
                    data-testid="qr-text-input"
                    className={textareaClassName}
                    value={state.text}
                    onChange={(event) => updateState({ text: event.target.value })}
                    placeholder={t("text.placeholder")}
                    aria-invalid={errorMessages.some((message) => message.code === "textTooLong")}
                  />
                </TabsContent>

                <TabsContent value="wifi" className="mt-0 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="qr-wifi-ssid">{t("wifi.ssid")}</Label>
                      <Input
                        id="qr-wifi-ssid"
                        data-testid="qr-wifi-ssid-input"
                        value={state.wifi.ssid}
                        onChange={(event) => updateState({ wifi: { ssid: event.target.value } })}
                        placeholder={t("wifi.ssidPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qr-wifi-encryption">{t("wifi.encryption")}</Label>
                      <Select
                        value={state.wifi.encryption}
                        onValueChange={(value) => updateState({ wifi: { encryption: value as QrWifiEncryption } })}>
                        <SelectTrigger id="qr-wifi-encryption" aria-label={t("wifi.encryption")} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WPA">{t("wifi.encryptionOptions.WPA")}</SelectItem>
                          <SelectItem value="WEP">{t("wifi.encryptionOptions.WEP")}</SelectItem>
                          <SelectItem value="nopass">{t("wifi.encryptionOptions.nopass")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {state.wifi.encryption !== "nopass" ? (
                    <div className="space-y-2">
                      <Label htmlFor="qr-wifi-password">{t("wifi.password")}</Label>
                      <Input
                        id="qr-wifi-password"
                        data-testid="qr-wifi-password-input"
                        type="password"
                        autoComplete="off"
                        value={state.wifi.password}
                        onChange={(event) => updateState({ wifi: { password: event.target.value } })}
                        placeholder={t("wifi.passwordPlaceholder")}
                      />
                    </div>
                  ) : null}

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      id="qr-wifi-hidden"
                      type="checkbox"
                      checked={state.wifi.hidden}
                      onChange={(event) => updateState({ wifi: { hidden: event.target.checked } })}
                    />
                    {t("wifi.hidden")}
                  </label>

                  {showWifiPasswordWarning ? (
                    <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      {t("wifi.passwordWarning")}
                    </p>
                  ) : null}
                </TabsContent>

                <TabsContent value="pix" className="mt-0 space-y-2">
                  <Label htmlFor="qr-pix">{t("pix.label")}</Label>
                  <textarea
                    id="qr-pix"
                    data-testid="qr-pix-input"
                    className={textareaClassName}
                    value={state.pix}
                    onChange={(event) => updateState({ pix: event.target.value })}
                    placeholder={t("pix.placeholder")}
                    aria-invalid={errorMessages.some((message) => message.code === "pixTooLong")}
                  />
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    {t("pix.note")}
                  </p>
                </TabsContent>

                {activeByteLength !== null ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("byteCount", { count: activeByteLength, limit: QR_TEXT_BYTE_LIMIT })}
                  </p>
                ) : null}
              </div>

              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="qr-style-title">
                <div>
                  <h3 id="qr-style-title" className="font-semibold">
                    {t("style.title")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("style.description")}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="qr-error-level">{t("style.level")}</Label>
                    <Select
                      value={state.style.level}
                      onValueChange={(value) => updateStyle({ level: value as QrErrorCorrectionLevel })}>
                      <SelectTrigger id="qr-error-level" aria-label={t("style.level")} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["L", "M", "Q", "H"] satisfies QrErrorCorrectionLevel[]).map((level) => (
                          <SelectItem key={level} value={level}>
                            {t(`style.levels.${level}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qr-size">{t("style.size")}</Label>
                    <Input
                      id="qr-size"
                      type="number"
                      min={QR_SIZE_MIN}
                      max={QR_SIZE_MAX}
                      value={state.style.size}
                      onChange={(event) => updateStyle({ size: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qr-margin">{t("style.margin")}</Label>
                    <Input
                      id="qr-margin"
                      type="number"
                      min={0}
                      max={QR_MARGIN_MAX}
                      value={state.style.margin}
                      onChange={(event) => updateStyle({ margin: Number(event.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="qr-foreground-color">{t("style.foreground")}</Label>
                      <Input
                        id="qr-foreground-color"
                        type="color"
                        value={state.style.foregroundColor}
                        onChange={(event) => updateStyle({ foregroundColor: event.target.value })}
                        className="h-10 p-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qr-background-color">{t("style.background")}</Label>
                      <Input
                        id="qr-background-color"
                        type="color"
                        value={state.style.backgroundColor}
                        onChange={(event) => updateStyle({ backgroundColor: event.target.value })}
                        className="h-10 p-1"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="qr-share-title">
                <div>
                  <h3 id="qr-share-title" className="font-semibold">
                    {t("privacy.title")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("privacy.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="qr-share-content"
                    type="checkbox"
                    checked={includeContentInUrl}
                    onChange={(event) => setIncludeContentInUrl(event.target.checked)}
                    className="mt-1"
                  />
                  <span>{t("privacy.includeContent")}</span>
                </label>
                <p
                  className={cn(
                    "text-sm",
                    includeContentInUrl ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                  )}>
                  {includeContentInUrl ? t("privacy.publicWarning") : t("privacy.safeShare")}
                </p>
              </section>
            </div>

            <aside className="space-y-4 rounded-lg border bg-muted/30 p-4" aria-labelledby="qr-result-title">
              <div>
                <h3 id="qr-result-title" className="font-semibold">
                  {t("result.title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`result.summary.${state.mode}`)}</p>
              </div>

              <div
                className="mx-auto flex aspect-square w-full max-w-72 items-center justify-center rounded-md bg-white p-4"
                data-testid="qr-preview">
                {result.isValid ? (
                  <QRCodeSVG
                    ref={svgRef}
                    value={result.payload}
                    size={state.style.size}
                    level={state.style.level}
                    marginSize={state.style.margin}
                    fgColor={state.style.foregroundColor}
                    bgColor={state.style.backgroundColor}
                    title={t("result.accessibleTitle")}
                    className="h-full w-full"
                    data-testid="qr-code-preview-svg"
                  />
                ) : (
                  <p className="px-4 text-center text-sm text-muted-foreground">{t("result.empty")}</p>
                )}
              </div>

              {result.isValid ? (
                <QRCodeCanvas
                  ref={canvasRef}
                  value={result.payload}
                  size={state.style.size}
                  level={state.style.level}
                  marginSize={state.style.margin}
                  fgColor={state.style.foregroundColor}
                  bgColor={state.style.backgroundColor}
                  className="hidden"
                />
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t("result.payload")}</p>
                <pre
                  className="max-h-36 overflow-auto whitespace-pre-wrap break-all rounded-md border bg-background p-3 font-mono text-xs"
                  data-testid="qr-payload">
                  {result.payload || t("result.noPayload")}
                </pre>
              </div>

              <div aria-live="polite" className="space-y-2">
                {[...errorMessages, ...warningMessages].map((message) => (
                  <p
                    key={message.code}
                    className={cn(
                      "text-sm",
                      message.severity === "error" ? "text-red-600" : "text-amber-700 dark:text-amber-400"
                    )}>
                    {t(`validation.${message.code}`)}
                  </p>
                ))}
              </div>

              <div className="grid gap-2">
                <Button type="button" onClick={handleCopyPayload} disabled={!result.payload} className="w-full gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("actions.copied") : t("actions.copyPayload")}
                </Button>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadSvg}
                    disabled={!result.payload}
                    className="gap-2">
                    <Download className="h-4 w-4" />
                    {t("actions.downloadSvg")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadPng}
                    disabled={!result.payload}
                    className="gap-2">
                    <Download className="h-4 w-4" />
                    {t("actions.downloadPng")}
                  </Button>
                </div>
                <ShareButton className="w-full" getShareUrl={() => getShareUrlFromParams(currentParams)} />
              </div>
            </aside>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
