import { describe, expect, test } from "vitest";
import {
  COLOR_PALETTE_SIZE_MAX,
  COLOR_PALETTE_SIZE_MIN,
  buildColorPaletteSearchParams,
  buildCssVariablesText,
  buildHexPaletteText,
  defaultColorPaletteState,
  formatHslColor,
  formatRgbColor,
  generateColorPalette,
  generateRandomHexColor,
  hexToRgb,
  hslToRgb,
  normalizeColorPaletteQuantity,
  normalizeHexColor,
  normalizeHue,
  readColorPaletteStateFromParams,
  rgbToHex,
  rgbToHsl,
  type ColorPaletteMode,
} from "./colors";

describe("color palette tool", () => {
  test("normalizes supported HEX forms and rejects invalid values", () => {
    expect(normalizeHexColor("#abc")).toBe("#AABBCC");
    expect(normalizeHexColor("abc")).toBe("#AABBCC");
    expect(normalizeHexColor("#AABBCC")).toBe("#AABBCC");
    expect(normalizeHexColor("aabbcc")).toBe("#AABBCC");

    expect(normalizeHexColor("abcd")).toBeNull();
    expect(normalizeHexColor("#12")).toBeNull();
    expect(normalizeHexColor("#zzzzzz")).toBeNull();
  });

  test("converts between HEX, RGB, and HSL for common colors", () => {
    expect(hexToRgb("#000")).toEqual({ red: 0, green: 0, blue: 0 });
    expect(hexToRgb("#fff")).toEqual({ red: 255, green: 255, blue: 255 });
    expect(rgbToHex({ red: 255, green: 0, blue: 0 })).toBe("#FF0000");
    expect(formatRgbColor({ red: 47, green: 128, blue: 237 })).toBe("rgb(47, 128, 237)");

    const redHsl = rgbToHsl({ red: 255, green: 0, blue: 0 });
    expect(redHsl.hue).toBeCloseTo(0);
    expect(redHsl.saturation).toBeCloseTo(100);
    expect(redHsl.lightness).toBeCloseTo(50);
    expect(hslToRgb({ hue: 120, saturation: 100, lightness: 50 })).toEqual({ red: 0, green: 255, blue: 0 });
    expect(formatHslColor(rgbToHsl({ red: 0, green: 0, blue: 255 }))).toBe("hsl(240, 100%, 50%)");
  });

  test("wraps hue and clamps palette quantity", () => {
    expect(normalizeHue(-20)).toBe(340);
    expect(normalizeHue(725)).toBe(5);
    expect(normalizeColorPaletteQuantity("2")).toBe(COLOR_PALETTE_SIZE_MIN);
    expect(normalizeColorPaletteQuantity("99")).toBe(COLOR_PALETTE_SIZE_MAX);
    expect(normalizeColorPaletteQuantity("abc")).toBe(defaultColorPaletteState.quantity);
  });

  test("generates requested palette sizes for each mode", () => {
    const modes: ColorPaletteMode[] = ["analogica", "complementar", "triadica", "monocromatica", "tons"];

    for (const mode of modes) {
      const result = generateColorPalette({ seedHex: "#2f80ed", mode, quantity: 8 });

      expect(result.state.seedHex).toBe("#2F80ED");
      expect(result.state.mode).toBe(mode);
      expect(result.colors).toHaveLength(8);
      expect(result.colors[0].hex).toBe("#2F80ED");

      for (const color of result.colors) {
        expect(color.hex).toMatch(/^#[0-9A-F]{6}$/);
        expect(color.rgb.red).toBeGreaterThanOrEqual(0);
        expect(color.rgb.red).toBeLessThanOrEqual(255);
        expect(color.hsl.hue).toBeGreaterThanOrEqual(0);
        expect(color.hsl.hue).toBeLessThanOrEqual(359);
        expect(color.hsl.saturation).toBeGreaterThanOrEqual(0);
        expect(color.hsl.lightness).toBeLessThanOrEqual(100);
      }
    }
  });

  test("builds monochromatic and tone palettes around the seed hue", () => {
    const mono = generateColorPalette({ seedHex: "#2F80ED", mode: "monocromatica", quantity: 5 });
    const tones = generateColorPalette({ seedHex: "#2F80ED", mode: "tons", quantity: 6 });
    const seedHue = mono.colors[0].hsl.hue;

    expect(mono.colors.slice(1).every((color) => Math.abs(color.hsl.hue - seedHue) <= 1)).toBe(true);
    expect(tones.colors.slice(1).every((color) => Math.abs(color.hsl.hue - seedHue) <= 1)).toBe(true);
    expect(new Set(tones.colors.map((color) => color.hsl.lightness)).size).toBeGreaterThan(3);
  });

  test("reads and writes only seed, mode, and quantity query state", () => {
    const state = readColorPaletteStateFromParams(
      new URLSearchParams("cor=2f80ed&modo=complementar&quantidade=6&extra=ignored")
    );

    expect(state).toEqual({
      seedHex: "#2F80ED",
      mode: "complementar",
      quantity: 6,
    });

    const params = buildColorPaletteSearchParams(state);

    expect(params.get("cor")).toBe("2F80ED");
    expect(params.get("modo")).toBe("complementar");
    expect(params.get("quantidade")).toBe("6");
    expect(params.get("extra")).toBeNull();

    expect(readColorPaletteStateFromParams(new URLSearchParams("cor=invalid&modo=zip&quantidade=abc"))).toEqual(
      defaultColorPaletteState
    );
    expect(readColorPaletteStateFromParams(new URLSearchParams("cor=%23abc&modo=tons&quantidade=99"))).toEqual({
      seedHex: "#AABBCC",
      mode: "tons",
      quantity: 8,
    });
  });

  test("builds stable copy formats and deterministic random colors", () => {
    const result = generateColorPalette({ seedHex: "#112233", mode: "triadica", quantity: 3 });

    expect(buildHexPaletteText(result.colors)).toMatch(/^#112233\n#[0-9A-F]{6}\n#[0-9A-F]{6}$/);
    expect(buildCssVariablesText(result.colors)).toBe(
      result.colors.map((color, index) => `--color-${index + 1}: ${color.hex};`).join("\n")
    );
    expect(generateRandomHexColor(() => 0)).toBe("#000000");
    expect(generateRandomHexColor(() => 0.999999)).toBe("#FFFFEF");
    expect(generateRandomHexColor(() => 1)).toBe("#FFFFFF");
  });
});
