import { describe, expect, test } from "vitest";
import {
  buildQrCodeSearchParams,
  buildQrPayload,
  buildWifiPayload,
  defaultQrCodeFormState,
  escapeWifiValue,
  normalizeQrStyleOptions,
  readQrCodeStateFromParams,
  validateQrStyleOptions,
  type QrCodeFormState,
} from "./qr-code";

function makeState(patch: Partial<QrCodeFormState>): QrCodeFormState {
  return {
    ...defaultQrCodeFormState,
    ...patch,
    wifi: {
      ...defaultQrCodeFormState.wifi,
      ...patch.wifi,
    },
    style: {
      ...defaultQrCodeFormState.style,
      ...patch.style,
    },
  };
}

describe("qr-code tool", () => {
  test("normalizes URL payloads and rejects unsupported schemes", () => {
    const normalized = buildQrPayload(makeState({ url: "calculaderia.com/geradores" }));

    expect(normalized.isValid).toBe(true);
    expect(normalized.payload).toBe("https://calculaderia.com/geradores");
    expect(normalized.normalizedUrl).toBe("https://calculaderia.com/geradores");

    const unsupported = buildQrPayload(makeState({ url: "ftp://example.com/file" }));

    expect(unsupported.isValid).toBe(false);
    expect(unsupported.payload).toBe("");
    expect(unsupported.messages).toContainEqual({ code: "unsupportedUrlScheme", severity: "error" });
  });

  test("builds text and Pix payloads without mutating user content", () => {
    const text = buildQrPayload(makeState({ mode: "texto", text: "  Olá, QR Code  " }));
    const pix = buildQrPayload(makeState({ mode: "pix", pix: "00020126360014BR.GOV.BCB.PIX0114teste@pix.com" }));

    expect(text.payload).toBe("  Olá, QR Code  ");
    expect(pix.payload).toBe("00020126360014BR.GOV.BCB.PIX0114teste@pix.com");
  });

  test("builds Wi-Fi payloads and escapes special characters", () => {
    expect(escapeWifiValue('Cafe;Net:1"\\')).toBe('Cafe\\;Net\\:1\\"\\\\');

    const payload = buildWifiPayload({
      encryption: "WPA",
      ssid: 'Cafe;Net:1"\\',
      password: "pa,ss;word",
      hidden: true,
    });

    expect(payload).toBe('WIFI:T:WPA;S:Cafe\\;Net\\:1\\"\\\\;P:pa\\,ss\\;word;H:true;;');
  });

  test("ignores Wi-Fi password in no-password mode", () => {
    const payload = buildQrPayload(
      makeState({
        mode: "wifi",
        wifi: {
          ssid: "Rede aberta",
          password: "nao-deve-entrar",
          encryption: "nopass",
          hidden: false,
        },
      })
    );

    expect(payload.isValid).toBe(true);
    expect(payload.payload).toBe("WIFI:T:nopass;S:Rede aberta;P:;H:false;;");
    expect(payload.payload).not.toContain("nao-deve-entrar");
  });

  test("validates required content, byte limits, and Wi-Fi password warnings", () => {
    const emptyText = buildQrPayload(makeState({ mode: "texto", text: "   " }));
    const longPix = buildQrPayload(makeState({ mode: "pix", pix: "ç".repeat(1001) }));
    const wifi = buildQrPayload(
      makeState({
        mode: "wifi",
        wifi: {
          ssid: "Cafe",
          password: "curta",
          encryption: "WPA",
          hidden: false,
        },
      })
    );

    expect(emptyText.messages).toContainEqual({ code: "contentRequired", severity: "error" });
    expect(longPix.messages).toContainEqual({ code: "pixTooLong", severity: "error" });
    expect(wifi.isValid).toBe(true);
    expect(wifi.messages).toContainEqual({ code: "wifiContainsPassword", severity: "warning" });
    expect(wifi.messages).toContainEqual({ code: "wifiPasswordLength", severity: "warning" });
  });

  test("normalizes style options and flags scanability issues", () => {
    const style = normalizeQrStyleOptions({
      level: "Z" as never,
      size: 5000,
      margin: -4,
      foregroundColor: "111111",
      backgroundColor: "#111111",
    });

    expect(style).toEqual({
      level: "M",
      size: 1024,
      margin: 0,
      foregroundColor: "#111111",
      backgroundColor: "#111111",
    });
    expect(validateQrStyleOptions(style)).toContainEqual({ code: "sameColors", severity: "error" });
    expect(
      validateQrStyleOptions({
        ...style,
        foregroundColor: "#777777",
        backgroundColor: "#888888",
      })
    ).toContainEqual({ code: "lowContrast", severity: "warning" });
  });

  test("keeps sensitive content out of safe URL state unless explicit", () => {
    const state = makeState({
      mode: "wifi",
      wifi: {
        ssid: "Casa",
        password: "senha-secreta",
        encryption: "WPA",
        hidden: true,
      },
    });

    const safeParams = buildQrCodeSearchParams(state);
    const contentParams = buildQrCodeSearchParams(state, { includeContent: true });

    expect(safeParams.toString()).not.toContain("senha-secreta");
    expect(safeParams.get("conteudo")).toBeNull();
    expect(contentParams.get("conteudo")).toBe("1");
    expect(contentParams.get("senha")).toBe("senha-secreta");

    const ignoredContent = readQrCodeStateFromParams(new URLSearchParams("tipo=wifi&ssid=Casa&senha=senha-secreta"));
    expect(ignoredContent.wifi.password).toBe("");

    const restored = readQrCodeStateFromParams(contentParams);
    expect(restored.wifi.password).toBe("senha-secreta");
    expect(restored.wifi.hidden).toBe(true);
  });
});
