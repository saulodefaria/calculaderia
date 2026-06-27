export type ColorPaletteMode = "analogica" | "complementar" | "triadica" | "monocromatica" | "tons";

export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

export interface ColorPaletteState {
  seedHex: string;
  mode: ColorPaletteMode;
  quantity: number;
}

export interface PaletteColor {
  index: number;
  hex: string;
  rgb: RgbColor;
  hsl: HslColor;
  rgbString: string;
  hslString: string;
}

export interface ColorPaletteResult {
  state: ColorPaletteState;
  colors: PaletteColor[];
}

export const COLOR_PALETTE_SIZE_MIN = 3;
export const COLOR_PALETTE_SIZE_MAX = 8;
export const COLOR_PALETTE_MODES = [
  "analogica",
  "complementar",
  "triadica",
  "monocromatica",
  "tons",
] as const satisfies ColorPaletteMode[];

export const defaultColorPaletteQuantitiesByMode: Record<ColorPaletteMode, number> = {
  analogica: 5,
  complementar: 4,
  triadica: 3,
  monocromatica: 5,
  tons: 6,
};

export const defaultColorPaletteState: ColorPaletteState = {
  seedHex: "#2F80ED",
  mode: "analogica",
  quantity: defaultColorPaletteQuantitiesByMode.analogica,
};

const modeValues = new Set<ColorPaletteMode>(COLOR_PALETTE_MODES);
const hexColorRegex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampInteger(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function normalizeHue(value: number): number {
  const hue = value % 360;
  return hue < 0 ? hue + 360 : hue;
}

export function normalizeHexColor(value: string | null | undefined): string | null {
  if (!value) return null;

  const match = value.trim().match(hexColorRegex);
  if (!match) return null;

  const rawHex = match[1] ?? "";
  const expandedHex =
    rawHex.length === 3
      ? rawHex
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : rawHex;

  return `#${expandedHex.toUpperCase()}`;
}

export function normalizeColorPaletteMode(value: string | null | undefined): ColorPaletteMode {
  return value && modeValues.has(value as ColorPaletteMode) ? (value as ColorPaletteMode) : defaultColorPaletteState.mode;
}

export function normalizeColorPaletteQuantity(
  value: string | number | null | undefined,
  fallback = defaultColorPaletteState.quantity
): number {
  if (value === null || value === undefined || value === "") return fallback;

  return clampInteger(Number(value), COLOR_PALETTE_SIZE_MIN, COLOR_PALETTE_SIZE_MAX, fallback);
}

export function getDefaultColorPaletteQuantity(mode: ColorPaletteMode): number {
  return defaultColorPaletteQuantitiesByMode[mode];
}

export function hexToRgb(value: string): RgbColor | null {
  const normalized = normalizeHexColor(value);
  if (!normalized) return null;

  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex(color: RgbColor): string {
  return `#${[color.red, color.green, color.blue]
    .map((channel) => clampInteger(Math.round(channel), 0, 255, 0).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function rgbToHsl(color: RgbColor): HslColor {
  const red = clampNumber(color.red, 0, 255) / 255;
  const green = clampNumber(color.green, 0, 255) / 255;
  const blue = clampNumber(color.blue, 0, 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return {
      hue: 0,
      saturation: 0,
      lightness: lightness * 100,
    };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (max === red) {
    hue = 60 * (((green - blue) / delta) % 6);
  } else if (max === green) {
    hue = 60 * ((blue - red) / delta + 2);
  } else {
    hue = 60 * ((red - green) / delta + 4);
  }

  return {
    hue: normalizeHue(hue),
    saturation: saturation * 100,
    lightness: lightness * 100,
  };
}

function hueToRgb(p: number, q: number, value: number): number {
  let t = value;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToRgb(color: HslColor): RgbColor {
  const hue = normalizeHue(color.hue) / 360;
  const saturation = clampNumber(color.saturation, 0, 100) / 100;
  const lightness = clampNumber(color.lightness, 0, 100) / 100;

  if (saturation === 0) {
    const channel = Math.round(lightness * 255);
    return { red: channel, green: channel, blue: channel };
  }

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    red: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    green: Math.round(hueToRgb(p, q, hue) * 255),
    blue: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  };
}

function roundHslForDisplay(color: HslColor): HslColor {
  return {
    hue: clampInteger(Math.round(normalizeHue(color.hue)), 0, 359, 0),
    saturation: clampInteger(Math.round(color.saturation), 0, 100, 0),
    lightness: clampInteger(Math.round(color.lightness), 0, 100, 0),
  };
}

export function formatRgbColor(color: RgbColor): string {
  return `rgb(${color.red}, ${color.green}, ${color.blue})`;
}

export function formatHslColor(color: HslColor): string {
  const rounded = roundHslForDisplay(color);
  return `hsl(${rounded.hue}, ${rounded.saturation}%, ${rounded.lightness}%)`;
}

function clampVariantSaturation(value: number, seedSaturation: number): number {
  if (seedSaturation < 4) return clampNumber(value, 0, 14);
  return clampNumber(value, 8, 95);
}

function clampVariantLightness(value: number): number {
  return clampNumber(value, 12, 88);
}

function makeVariant(
  seed: HslColor,
  options: {
    hueOffset?: number;
    saturationFactor?: number;
    saturationDelta?: number;
    lightnessDelta?: number;
    lightness?: number;
  }
): HslColor {
  return {
    hue: normalizeHue(seed.hue + (options.hueOffset ?? 0)),
    saturation: clampVariantSaturation(
      seed.saturation * (options.saturationFactor ?? 1) + (options.saturationDelta ?? 0),
      seed.saturation
    ),
    lightness: clampVariantLightness(options.lightness ?? seed.lightness + (options.lightnessDelta ?? 0)),
  };
}

function takeVariants(seed: HslColor, configs: Parameters<typeof makeVariant>[1][], count: number): HslColor[] {
  return configs.slice(0, count).map((config) => makeVariant(seed, config));
}

function buildModeVariants(seed: HslColor, mode: ColorPaletteMode, count: number): HslColor[] {
  if (count <= 0) return [];

  switch (mode) {
    case "analogica":
      return takeVariants(
        seed,
        [
          { hueOffset: -40, saturationFactor: 0.98, lightnessDelta: -2 },
          { hueOffset: -24, saturationFactor: 1.04, lightnessDelta: 4 },
          { hueOffset: -12, saturationFactor: 0.92, lightnessDelta: -8 },
          { hueOffset: 12, saturationFactor: 1.02, lightnessDelta: 6 },
          { hueOffset: 24, saturationFactor: 0.9, lightnessDelta: -12 },
          { hueOffset: 40, saturationFactor: 1.06, lightnessDelta: 2 },
          { hueOffset: 0, saturationFactor: 0.72, lightnessDelta: 18 },
        ],
        count
      );
    case "complementar":
      return takeVariants(
        seed,
        [
          { hueOffset: 180 },
          { hueOffset: 0, saturationFactor: 0.82, lightnessDelta: -18 },
          { hueOffset: 180, saturationFactor: 0.82, lightnessDelta: 18 },
          { hueOffset: 30, saturationFactor: 0.9, lightnessDelta: 8 },
          { hueOffset: 210, saturationFactor: 0.9, lightnessDelta: -8 },
          { hueOffset: 150, saturationFactor: 0.78, lightnessDelta: 20 },
          { hueOffset: 330, saturationFactor: 0.78, lightnessDelta: -20 },
        ],
        count
      );
    case "triadica":
      return takeVariants(
        seed,
        [
          { hueOffset: 120 },
          { hueOffset: 240 },
          { hueOffset: 0, saturationFactor: 0.82, lightnessDelta: -16 },
          { hueOffset: 120, saturationFactor: 0.9, lightnessDelta: 14 },
          { hueOffset: 240, saturationFactor: 0.74, lightnessDelta: -8 },
          { hueOffset: 60, saturationFactor: 0.72, lightnessDelta: 18 },
          { hueOffset: 300, saturationFactor: 0.88, lightnessDelta: -18 },
        ],
        count
      );
    case "monocromatica":
      return takeVariants(
        seed,
        [
          { saturationFactor: 0.82, lightnessDelta: -20 },
          { saturationFactor: 0.68, lightnessDelta: 18 },
          { saturationFactor: 1.08, lightnessDelta: -8 },
          { saturationFactor: 0.52, lightnessDelta: 30 },
          { saturationFactor: 0.94, lightnessDelta: 8 },
          { saturationFactor: 0.62, lightnessDelta: -12 },
          { saturationFactor: 1.12, lightnessDelta: 22 },
        ],
        count
      );
    case "tons": {
      const toneLightness = [18, 30, 42, 54, 66, 78, 88];
      return toneLightness.slice(0, count).map((lightness, index) => {
        const adjustedLightness = Math.abs(lightness - seed.lightness) < 3 ? lightness + (index % 2 === 0 ? -6 : 6) : lightness;

        return makeVariant(seed, {
          saturationFactor: 1,
          lightness: adjustedLightness,
        });
      });
    }
  }
}

function buildPaletteColor(index: number, rgb: RgbColor): PaletteColor {
  const hsl = roundHslForDisplay(rgbToHsl(rgb));

  return {
    index,
    hex: rgbToHex(rgb),
    rgb,
    hsl,
    rgbString: formatRgbColor(rgb),
    hslString: formatHslColor(hsl),
  };
}

export function normalizeColorPaletteState(input: Partial<ColorPaletteState> = {}): ColorPaletteState {
  const mode = normalizeColorPaletteMode(input.mode);
  const fallbackQuantity = getDefaultColorPaletteQuantity(mode);

  return {
    seedHex: normalizeHexColor(input.seedHex) ?? defaultColorPaletteState.seedHex,
    mode,
    quantity: normalizeColorPaletteQuantity(input.quantity, fallbackQuantity),
  };
}

export function generateColorPalette(input: Partial<ColorPaletteState> = {}): ColorPaletteResult {
  const state = normalizeColorPaletteState(input);
  const seedRgb = hexToRgb(state.seedHex) ?? hexToRgb(defaultColorPaletteState.seedHex);
  if (!seedRgb) {
    return {
      state: defaultColorPaletteState,
      colors: [],
    };
  }

  const seedHsl = rgbToHsl(seedRgb);
  const variantHsl = buildModeVariants(seedHsl, state.mode, state.quantity - 1);
  const colors = [
    buildPaletteColor(1, seedRgb),
    ...variantHsl.map((hsl, index) => buildPaletteColor(index + 2, hslToRgb(hsl))),
  ];

  return { state, colors };
}

export function buildHexPaletteText(colors: readonly PaletteColor[]): string {
  return colors.map((color) => color.hex).join("\n");
}

export function buildCssVariablesText(colors: readonly PaletteColor[], prefix = "color"): string {
  return colors.map((color, index) => `--${prefix}-${index + 1}: ${color.hex};`).join("\n");
}

export function buildColorPaletteSearchParams(input: Partial<ColorPaletteState>): URLSearchParams {
  const state = normalizeColorPaletteState(input);
  const params = new URLSearchParams();

  params.set("cor", state.seedHex.slice(1));
  params.set("modo", state.mode);
  params.set("quantidade", String(state.quantity));

  return params;
}

export function readColorPaletteStateFromParams(params: URLSearchParams): ColorPaletteState {
  const mode = normalizeColorPaletteMode(params.get("modo"));
  const fallbackQuantity = getDefaultColorPaletteQuantity(mode);

  return {
    seedHex: normalizeHexColor(params.get("cor")) ?? defaultColorPaletteState.seedHex,
    mode,
    quantity: normalizeColorPaletteQuantity(params.get("quantidade"), fallbackQuantity),
  };
}

export function generateRandomHexColor(random = Math.random): string {
  const value = Math.min(0xffffff, Math.max(0, Math.trunc(random() * 0x1000000)));
  return `#${value.toString(16).padStart(6, "0").toUpperCase()}`;
}
