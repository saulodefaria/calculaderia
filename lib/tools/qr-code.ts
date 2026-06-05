export type QrCodeMode = "url" | "texto" | "wifi" | "pix";
export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";
export type QrWifiEncryption = "WPA" | "WEP" | "nopass";

export type QrValidationCode =
  | "contentRequired"
  | "invalidUrl"
  | "unsupportedUrlScheme"
  | "textTooLong"
  | "pixTooLong"
  | "ssidRequired"
  | "ssidTooLong"
  | "wifiPasswordRequired"
  | "wifiPasswordLength"
  | "wifiContainsPassword"
  | "invalidForegroundColor"
  | "invalidBackgroundColor"
  | "sameColors"
  | "lowContrast";

export interface QrValidationMessage {
  code: QrValidationCode;
  severity: "error" | "warning";
}

export interface QrWifiInput {
  ssid: string;
  password: string;
  encryption: QrWifiEncryption;
  hidden: boolean;
}

export interface QrStyleOptions {
  level: QrErrorCorrectionLevel;
  size: number;
  margin: number;
  foregroundColor: string;
  backgroundColor: string;
}

export interface QrCodeFormState {
  mode: QrCodeMode;
  url: string;
  text: string;
  pix: string;
  wifi: QrWifiInput;
  style: QrStyleOptions;
}

export interface QrPayloadResult {
  payload: string;
  normalizedUrl?: string;
  messages: QrValidationMessage[];
  isValid: boolean;
}

export const QR_TEXT_BYTE_LIMIT = 2000;
export const QR_WIFI_SSID_BYTE_LIMIT = 32;
export const QR_SIZE_MIN = 128;
export const QR_SIZE_MAX = 1024;
export const QR_MARGIN_MIN = 0;
export const QR_MARGIN_MAX = 8;

export const defaultQrStyleOptions: QrStyleOptions = {
  level: "M",
  size: 240,
  margin: 2,
  foregroundColor: "#000000",
  backgroundColor: "#ffffff",
};

export const defaultQrCodeFormState: QrCodeFormState = {
  mode: "url",
  url: "",
  text: "",
  pix: "",
  wifi: {
    ssid: "",
    password: "",
    encryption: "WPA",
    hidden: false,
  },
  style: defaultQrStyleOptions,
};

const modeValues = new Set<QrCodeMode>(["url", "texto", "wifi", "pix"]);
const levelValues = new Set<QrErrorCorrectionLevel>(["L", "M", "Q", "H"]);
const encryptionValues = new Set<QrWifiEncryption>(["WPA", "WEP", "nopass"]);
const hexColorRegex = /^#[0-9a-f]{6}$/i;
const urlSchemeRegex = /^[a-z][a-z0-9+.-]*:/i;
const hexPskRegex = /^[0-9a-f]{64}$/i;

function cloneDefaultState(): QrCodeFormState {
  return {
    ...defaultQrCodeFormState,
    wifi: { ...defaultQrCodeFormState.wifi },
    style: { ...defaultQrCodeFormState.style },
  };
}

function isQrCodeMode(value: string | null): value is QrCodeMode {
  return value !== null && modeValues.has(value as QrCodeMode);
}

function isErrorCorrectionLevel(value: string | null): value is QrErrorCorrectionLevel {
  return value !== null && levelValues.has(value as QrErrorCorrectionLevel);
}

function isWifiEncryption(value: string | null): value is QrWifiEncryption {
  return value !== null && encryptionValues.has(value as QrWifiEncryption);
}

function clampInteger(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function isValidHexColor(value: string): boolean {
  return hexColorRegex.test(value);
}

export function normalizeHexColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;

  return isValidHexColor(normalized) ? normalized.toLowerCase() : fallback;
}

export function normalizeQrStyleOptions(input: Partial<QrStyleOptions> = {}): QrStyleOptions {
  const level = input.level ?? null;

  return {
    level: isErrorCorrectionLevel(level) ? level : defaultQrStyleOptions.level,
    size: clampInteger(Number(input.size), QR_SIZE_MIN, QR_SIZE_MAX, defaultQrStyleOptions.size),
    margin: clampInteger(Number(input.margin), QR_MARGIN_MIN, QR_MARGIN_MAX, defaultQrStyleOptions.margin),
    foregroundColor: normalizeHexColor(input.foregroundColor, defaultQrStyleOptions.foregroundColor),
    backgroundColor: normalizeHexColor(input.backgroundColor, defaultQrStyleOptions.backgroundColor),
  };
}

function hexToRgb(color: string) {
  if (!isValidHexColor(color)) return null;

  return {
    red: Number.parseInt(color.slice(1, 3), 16),
    green: Number.parseInt(color.slice(3, 5), 16),
    blue: Number.parseInt(color.slice(5, 7), 16),
  };
}

function toLinearChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  return 0.2126 * toLinearChannel(rgb.red) + 0.7152 * toLinearChannel(rgb.green) + 0.0722 * toLinearChannel(rgb.blue);
}

export function getContrastRatio(foregroundColor: string, backgroundColor: string): number {
  const foreground = getRelativeLuminance(foregroundColor);
  const background = getRelativeLuminance(backgroundColor);
  const lighter = Math.max(foreground, background);
  const darker = Math.min(foreground, background);

  return (lighter + 0.05) / (darker + 0.05);
}

export function validateQrStyleOptions(style: QrStyleOptions): QrValidationMessage[] {
  const messages: QrValidationMessage[] = [];
  const foregroundColor = style.foregroundColor.toLowerCase();
  const backgroundColor = style.backgroundColor.toLowerCase();
  const hasValidForeground = isValidHexColor(foregroundColor);
  const hasValidBackground = isValidHexColor(backgroundColor);

  if (!hasValidForeground) {
    messages.push({ code: "invalidForegroundColor", severity: "error" });
  }

  if (!hasValidBackground) {
    messages.push({ code: "invalidBackgroundColor", severity: "error" });
  }

  if (hasValidForeground && hasValidBackground) {
    if (foregroundColor === backgroundColor) {
      messages.push({ code: "sameColors", severity: "error" });
    } else if (getContrastRatio(foregroundColor, backgroundColor) < 3) {
      messages.push({ code: "lowContrast", severity: "warning" });
    }
  }

  return messages;
}

export function normalizeUrlPayload(value: string): Pick<QrPayloadResult, "payload" | "normalizedUrl" | "messages"> {
  const trimmed = value.trim();
  if (!trimmed) {
    return { payload: "", messages: [{ code: "contentRequired", severity: "error" }] };
  }

  const candidate = urlSchemeRegex.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { payload: "", messages: [{ code: "unsupportedUrlScheme", severity: "error" }] };
    }

    if (!url.hostname) {
      return { payload: "", messages: [{ code: "invalidUrl", severity: "error" }] };
    }

    return { payload: url.toString(), normalizedUrl: url.toString(), messages: [] };
  } catch {
    return { payload: "", messages: [{ code: "invalidUrl", severity: "error" }] };
  }
}

export function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiPayload(wifi: QrWifiInput): string {
  const password = wifi.encryption === "nopass" ? "" : escapeWifiValue(wifi.password);

  return `WIFI:T:${wifi.encryption};S:${escapeWifiValue(wifi.ssid)};P:${password};H:${wifi.hidden ? "true" : "false"};;`;
}

function validateTextPayload(value: string, tooLongCode: QrValidationCode): QrValidationMessage[] {
  if (!value.trim()) {
    return [{ code: "contentRequired", severity: "error" }];
  }

  if (getUtf8ByteLength(value) > QR_TEXT_BYTE_LIMIT) {
    return [{ code: tooLongCode, severity: "error" }];
  }

  return [];
}

function validateWifiInput(wifi: QrWifiInput): QrValidationMessage[] {
  const messages: QrValidationMessage[] = [];
  const ssid = wifi.ssid.trim();

  if (!ssid) {
    messages.push({ code: "ssidRequired", severity: "error" });
  } else if (getUtf8ByteLength(ssid) > QR_WIFI_SSID_BYTE_LIMIT) {
    messages.push({ code: "ssidTooLong", severity: "error" });
  }

  if (wifi.encryption !== "nopass") {
    if (!wifi.password) {
      messages.push({ code: "wifiPasswordRequired", severity: "error" });
    } else {
      messages.push({ code: "wifiContainsPassword", severity: "warning" });

      if (wifi.encryption === "WPA" && !hexPskRegex.test(wifi.password)) {
        const passwordLength = wifi.password.length;
        if (passwordLength < 8 || passwordLength > 63) {
          messages.push({ code: "wifiPasswordLength", severity: "warning" });
        }
      }
    }
  }

  return messages;
}

export function buildQrPayload(state: QrCodeFormState): QrPayloadResult {
  const messages = validateQrStyleOptions(state.style);
  let payload = "";
  let normalizedUrl: string | undefined;

  if (state.mode === "url") {
    const result = normalizeUrlPayload(state.url);
    payload = result.payload;
    normalizedUrl = result.normalizedUrl;
    messages.push(...result.messages);
  }

  if (state.mode === "texto") {
    messages.push(...validateTextPayload(state.text, "textTooLong"));
    payload = state.text;
  }

  if (state.mode === "pix") {
    messages.push(...validateTextPayload(state.pix, "pixTooLong"));
    payload = state.pix;
  }

  if (state.mode === "wifi") {
    messages.push(...validateWifiInput(state.wifi));
    payload = buildWifiPayload(state.wifi);
  }

  const isValid = !messages.some((message) => message.severity === "error");

  return {
    payload: isValid ? payload : "",
    normalizedUrl,
    messages,
    isValid,
  };
}

function readBooleanParam(value: string | null): boolean {
  return value === "1" || value === "true";
}

export function readQrCodeStateFromParams(params: URLSearchParams): QrCodeFormState {
  const state = cloneDefaultState();
  const hasExplicitContent = params.get("conteudo") === "1";

  state.mode = isQrCodeMode(params.get("tipo")) ? (params.get("tipo") as QrCodeMode) : state.mode;
  state.style = normalizeQrStyleOptions({
    level: isErrorCorrectionLevel(params.get("nivel")) ? (params.get("nivel") as QrErrorCorrectionLevel) : undefined,
    size: Number(params.get("tamanho") ?? state.style.size),
    margin: Number(params.get("margem") ?? state.style.margin),
    foregroundColor: params.get("cor") ?? state.style.foregroundColor,
    backgroundColor: params.get("fundo") ?? state.style.backgroundColor,
  });

  if (!hasExplicitContent) {
    return state;
  }

  state.url = params.get("url") ?? state.url;
  state.text = params.get("texto") ?? state.text;
  state.pix = params.get("pix") ?? state.pix;
  state.wifi = {
    ssid: params.get("ssid") ?? state.wifi.ssid,
    password: params.get("senha") ?? state.wifi.password,
    encryption: isWifiEncryption(params.get("criptografia"))
      ? (params.get("criptografia") as QrWifiEncryption)
      : state.wifi.encryption,
    hidden: readBooleanParam(params.get("oculta")),
  };

  return state;
}

export function buildQrCodeSearchParams(
  state: QrCodeFormState,
  options: { includeContent?: boolean } = {}
): URLSearchParams {
  const style = normalizeQrStyleOptions(state.style);
  const params = new URLSearchParams();

  params.set("tipo", state.mode);
  params.set("nivel", style.level);
  params.set("tamanho", String(style.size));
  params.set("margem", String(style.margin));
  params.set("cor", style.foregroundColor);
  params.set("fundo", style.backgroundColor);

  if (!options.includeContent) {
    return params;
  }

  params.set("conteudo", "1");

  if (state.mode === "url" && state.url) params.set("url", state.url);
  if (state.mode === "texto" && state.text) params.set("texto", state.text);
  if (state.mode === "pix" && state.pix) params.set("pix", state.pix);

  if (state.mode === "wifi") {
    if (state.wifi.ssid) params.set("ssid", state.wifi.ssid);
    params.set("criptografia", state.wifi.encryption);
    if (state.wifi.encryption !== "nopass" && state.wifi.password) params.set("senha", state.wifi.password);
    if (state.wifi.hidden) params.set("oculta", "1");
  }

  return params;
}
