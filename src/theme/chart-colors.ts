import { Hct } from './color-engine/hct';
import { TonalPalette } from './color-engine/tonal-palette';
import { argbFromRgb, redFromArgb, greenFromArgb, blueFromArgb } from './color-engine/color-utils';
import { parseRgba } from './color-utils';
import type { Theme, ThemeChartColor } from './types';

/** Keep the first five canonical series stable; interleave four extra hues. */
const HUE_OFFSETS = [0, 72, 144, 216, 288, 36, 108, 180, 252] as const;
const MONO_STEPS = [0, 1, 2, 3, 4, 0.5, 1.5, 2.5, 3.5] as const;
const rgb = (argb: number) => `rgb(${redFromArgb(argb)} ${greenFromArgb(argb)} ${blueFromArgb(argb)})`;

/** One categorical policy for CSS tokens, JS themes and custom-theme fallback. */
export function createChartColors(hue: number, isDark: boolean, monochrome: boolean): readonly ThemeChartColor[] {
  return HUE_OFFSETS.map((offset, index) => {
    const palette = TonalPalette.fromHueAndChroma(monochrome ? 0 : (hue + offset) % 360, monochrome ? 0 : 60);
    const tone = monochrome ? (isDark ? 40 + MONO_STEPS[index]! * 13 : 78 - MONO_STEPS[index]! * 13) : isDark ? 72 : 48;
    // A uniform mono shift keeps every neighbouring step separated, including
    // the lightest dark-mode series; clipping an +8 shift would crowd it.
    const activeTone = tone + (isDark ? (monochrome ? 3 : 8) : -8);
    return { color: rgb(palette.tone(tone)), activeColor: rgb(palette.tone(activeTone)) };
  });
}

export function chartColorsFromTokens(tokens: Record<string, string>): readonly ThemeChartColor[] {
  return HUE_OFFSETS.map((_, index) => {
    const color = tokens[`--chart-${index + 1}`];
    const activeColor = tokens[`--chart-${index + 1}-active`];
    if (!color || !activeColor) throw new Error(`Missing canonical chart-${index + 1} pair`);
    return { color, activeColor };
  });
}

/** Hand-authored themes may omit the optional palette; use the same policy. */
export function resolveThemeChartColors(theme: Theme): readonly ThemeChartColor[] {
  if (theme.chartColors?.length === 9) return theme.chartColors;
  const source = parseRgba(theme.colors.primary);
  if (!source) return createChartColors(0, theme.isDark, true);
  const seed = Hct.fromInt(argbFromRgb(source.r, source.g, source.b));
  return createChartColors(seed.hue, theme.isDark, seed.chroma <= 6);
}
