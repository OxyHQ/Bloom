import { resolveAccentColors } from '../theme/accent-colors';
import { BUTTON_SHADOW, mixColor } from '../button/shared';
import { resolveThemeChartColors } from '../theme/chart-colors';
import type { Theme } from '../theme/types';

/** Chart surfaces, text and status use the same semantic roles as other cards. */
export interface ChartCardPalette {
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  neutralSeries: string;
  cursor: string;
  track: string;
  positive: { background: string; foreground: string };
  negative: { background: string; foreground: string };
  neutral: { background: string; foreground: string };
  /** `background-inner-default` — the stat tiles under a chart. */
  inner: string;
  /** The period pill: `background-primary-default` / `-hover`, `border-button-default`, `shadow-xs`. */
  pill: { background: string; hover: string; border: string; shadow: string };
}

/** A series' fill and its hover (`-active`) step. */
export interface ChartSeriesTone {
  color: string;
  activeColor: string;
}

export function resolveChartCardPalette(theme: Theme): ChartCardPalette {
  const c = theme.colors;
  return {
    surface: c.card,
    text: c.text,
    textSecondary: c.textSecondary,
    textTertiary: c.textTertiary,
    neutralSeries: c.textTertiary,
    cursor: c.border,
    track: c.contrast50,
    positive: resolveAccentColors(c, 'success', 'subtle'),
    negative: resolveAccentColors(c, 'error', 'subtle'),
    neutral: resolveAccentColors(c, 'default', 'subtle'),
    inner: c.backgroundSecondary,
    pill: { background: c.backgroundSecondary, hover: c.contrast50, border: c.borderLight, shadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'] },
  };
}

/** Index into the canonical nine-series palette; independent of a named hue. */
export type ChartHue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export function chartHueTone(theme: Theme, hue: ChartHue): ChartSeriesTone {
  return resolveThemeChartColors(theme)[hue - 1]!;
}

/** The original five separated hues first, then the four interleaved additions. */
export const CHART_TONE_ORDER: readonly ChartHue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function resolveChartTones(theme: Theme): ChartSeriesTone[] {
  return [...resolveThemeChartColors(theme)];
}

/**
 * Resolves a series tone: an explicit `color` (+ optional `activeColor`)
 * wins; otherwise the palette entry for the index. A custom colour without a
 * hover step is darkened like `color-mix(in srgb, color 82%, black)`.
 */
export function resolveTone(
  tones: readonly ChartSeriesTone[],
  index: number,
  color?: string,
  activeColor?: string,
): ChartSeriesTone {
  if (color) return { color, activeColor: activeColor ?? mixColor('rgb(0 0 0)', color, 0.82) };
  return tones[((index % tones.length) + tones.length) % tones.length]!;
}

/** A neutral data series and its emphasis, drawn from the text contrast roles. */
export function resolveMonoTone(theme: Theme): ChartSeriesTone {
  return { color: theme.colors.textSecondary, activeColor: theme.colors.text };
}

/** `chart-2` / `chart-2-active` — the revenue card's series. */
export function revenueSeriesTone(theme: Theme): ChartSeriesTone {
  return chartHueTone(theme, 2);
}

/** `chart-9` / `chart-9-active` — the orders card's series. */
export function ordersSeriesTone(theme: Theme): ChartSeriesTone {
  return chartHueTone(theme, 9);
}
