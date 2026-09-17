import { ACCENT_TABLE, BUTTON_SHADOW, DANGER_TABLE, colorRamp, mixColor, resolveButtonRamps } from '../button/shared';
import { oklchToSrgb, srgbToOklch, srgbToRgbString, type Oklch } from '../theme/color-space';
import { quietText, quietTextOver } from '../styles/color-contrast';
import { AA_TEXT, AA_TEXT_STRONG } from '../styles/surface-levels';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';

/**
 * Chart-card tokens on Bloom's ramps (`button/shared`):
 *
 *                              light           dark
 *   background-secondary       neutral-100     neutral-900     card surface
 *   text-primary               text            text            headline
 *   text-secondary             surfaceTextOn().textSecondary   label, legend
 *   text-tertiary              surfaceTextOn().textTertiary    caption, ticks
 *   chart-neutral              neutral-300     neutral-800     last year
 *   chart-cursor               neutral-300     neutral-700     line hover rule
 *   chart-track                neutral-200     neutral-800     bar hover band
 *   status-lime                200 / 800       950@60% / 500   rising delta
 *   status-rose                200 / 800       950@60% / 500   falling delta
 *   neutral chip               neutral-200/500 neutral-800/500 flat delta
 *   background-inner           card            n-800@60%       stat tiles
 *   background-primary         card            neutral-800     range pill
 *   background-primary-hover   neutral-100     n-700@60%       range pill hover
 *   border-button              neutral-200     neutral-700     range pill border
 *   shadow-xs                  black 5%        black 18%       range pill shadow
 *
 * The series hues, hardcoded and mapped to theme roles:
 *
 *   chart-2 (lime 400 / 500)     Tailwind's lightness, and its chroma ratio and
 *   chart-9 (indigo 400 / 500)   hue distance from `blue-500` re-anchored on
 *                                `primary`: a Tailwind-blue primary reproduces
 *                                lime and indigo, any other preset rotates both
 *                                with the brand
 *
 * A chart hue is DATA, not status, so it does not follow `success` — on the
 * default presets `success` is a deep green whose 400 stop paints a heavy
 * teal line where the chart draws a bright lime. The delta chips ARE status
 * and do follow `success` / `negative`.
 */
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
  const { neutral: n } = resolveButtonRamps(theme);
  const lime = colorRamp(theme.colors.success, ACCENT_TABLE);
  const rose = colorRamp(theme.colors.negative, DANGER_TABLE);
  const surface = theme.isDark ? n[900] : n[100];
  // The two quiet text rungs are read off THIS card's fill, not off a ramp stop.
  // As ramp stops they measured 4.38:1 (light) / 3.78:1 (dark) for the label and
  // 2.42:1 / 2.29:1 for the axis ticks — a chart whose own captions were below
  // AA, because `neutral-400` was chosen against the page and the card is not
  // the page. `surfaceTextOn` floors both against the surface they land on.
  // The stat tiles (`inner`) are a second fill these labels land on, and in dark
  // they sit on the OTHER side of the text from the card — so the rungs are
  // floored over both, not over whichever one happened to be checked.
  const inner = theme.isDark ? mixColor(surface, n[800], 0.6) : theme.colors.card;
  const fills = [surface, inner];
  const quiet = {
    textSecondary: quietTextOver(fills, theme.colors.text, AA_TEXT_STRONG),
    textTertiary: quietTextOver(fills, theme.colors.text, AA_TEXT),
  };
  return theme.isDark
    ? {
        surface,
        text: theme.colors.text,
        textSecondary: quiet.textSecondary,
        textTertiary: quiet.textTertiary,
        neutralSeries: n[800],
        cursor: n[700],
        track: n[800],
        positive: { background: mixColor(surface, lime[950], 0.6), foreground: lime[500] },
        negative: { background: mixColor(surface, rose[950], 0.6), foreground: rose[500] },
        neutral: { background: n[800], foreground: quietText(n[800], theme.colors.text, AA_TEXT) },
        inner,
        pill: { background: n[800], hover: mixColor(n[800], n[700], 0.6), border: n[700], shadow: BUTTON_SHADOW.dark },
      }
    : {
        surface,
        text: theme.colors.text,
        textSecondary: quiet.textSecondary,
        textTertiary: quiet.textTertiary,
        neutralSeries: n[300],
        cursor: n[300],
        track: n[200],
        positive: { background: lime[200], foreground: lime[800] },
        negative: { background: rose[200], foreground: rose[800] },
        neutral: { background: n[200], foreground: quietText(n[200], theme.colors.text, AA_TEXT) },
        inner,
        pill: { background: theme.colors.card, hover: n[100], border: n[200], shadow: BUTTON_SHADOW.light },
      };
}

/** Tailwind v4 `blue-500`, the anchor a role-less hue is measured from. */
const BLUE_500: Oklch = { l: 0.623, c: 0.214, h: 259.815 };

/**
 * `chart-1` … `chart-9` tokens as Tailwind v4's 400 (fill) and 500
 * (`-active`, hover) stops, in OKLCH.
 */
export const CHART_HUES = {
  1: [{ l: 0.777, c: 0.152, h: 181.912 }, { l: 0.704, c: 0.14, h: 182.503 }], // teal
  2: [{ l: 0.841, c: 0.238, h: 128.85 }, { l: 0.768, c: 0.233, h: 130.85 }], // lime
  3: [{ l: 0.718, c: 0.202, h: 349.761 }, { l: 0.656, c: 0.241, h: 354.308 }], // pink
  4: [{ l: 0.746, c: 0.16, h: 232.661 }, { l: 0.685, c: 0.169, h: 237.323 }], // sky
  5: [{ l: 0.714, c: 0.203, h: 305.504 }, { l: 0.627, c: 0.265, h: 303.9 }], // purple
  6: [{ l: 0.707, c: 0.165, h: 254.624 }, { l: 0.623, c: 0.214, h: 259.815 }], // blue
  7: [{ l: 0.765, c: 0.177, h: 163.223 }, { l: 0.696, c: 0.17, h: 162.48 }], // emerald
  8: [{ l: 0.852, c: 0.199, h: 91.936 }, { l: 0.795, c: 0.184, h: 86.047 }], // yellow
  9: [{ l: 0.673, c: 0.182, h: 276.935 }, { l: 0.585, c: 0.233, h: 277.117 }], // indigo
} as const satisfies Record<number, readonly [Oklch, Oklch]>;

export type ChartHue = keyof typeof CHART_HUES;

/** OKLCH → `rgb()`, reducing chroma until it fits sRGB (hue-stable). */
function toRgb({ l, c, h }: Oklch): string {
  let chroma = c;
  for (let i = 0; i < 24; i++) {
    const rgb = oklchToSrgb({ l, c: chroma, h });
    const back = srgbToOklch(rgb);
    if (Math.abs(back.l - l) < 0.01 && Math.abs(back.c - chroma) < 0.01) {
      return srgbToRgbString(rgb);
    }
    chroma *= 0.9;
  }
  return srgbToRgbString(oklchToSrgb({ l, c: chroma, h }));
}

function fromPrimary(primary: string, target: Oklch): string {
  const rgba = parseRgba(primary);
  if (!rgba) return primary;
  const base = srgbToOklch(rgba);
  return toRgb({
    // Tailwind's own lightness, like `colorRamp`'s absolute stops: a preset whose
    // primary sits darker than blue-500 would otherwise turn lime into olive.
    l: target.l,
    c: base.c * (target.c / BLUE_500.c),
    h: (((base.h + (target.h - BLUE_500.h)) % 360) + 360) % 360,
  });
}

/**
 * One `chart-n` token on the theme: Tailwind's lightness, with its chroma ratio
 * and hue distance from `blue-500` re-anchored on `primary`. A Tailwind-blue
 * primary reproduces the hues above exactly; any other preset rotates every
 * hue with the brand, so the series keep their relative spacing.
 */
export function chartHueTone(theme: Theme, hue: ChartHue): ChartSeriesTone {
  const [fill, active] = CHART_HUES[hue];
  return { color: fromPrimary(theme.colors.primary, fill), activeColor: fromPrimary(theme.colors.primary, active) };
}

/**
 * The default series order, chosen so neighbours stay distinct — lime, blue,
 * purple, pink, yellow, emerald, sky, teal.
 */
export const CHART_TONE_ORDER: readonly ChartHue[] = [2, 6, 5, 3, 8, 7, 4, 1];

export function resolveChartTones(theme: Theme): ChartSeriesTone[] {
  return CHART_TONE_ORDER.map((hue) => chartHueTone(theme, hue));
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

/**
 * The single-ink look: light mode a mid grey (neutral-500, hover 600), dark
 * mode near-white bands (neutral-50 at 84% over the card, hover neutral-50).
 */
export function resolveMonoTone(theme: Theme): ChartSeriesTone {
  const { neutral: n } = resolveButtonRamps(theme);
  if (!theme.isDark) return { color: n[500], activeColor: n[600] };
  return { color: mixColor(n[900], n[50], 0.84), activeColor: n[50] };
}

/** `chart-2` / `chart-2-active` — the revenue card's series. */
export function revenueSeriesTone(theme: Theme): ChartSeriesTone {
  return chartHueTone(theme, 2);
}

/** `chart-9` / `chart-9-active` — the orders card's series. */
export function ordersSeriesTone(theme: Theme): ChartSeriesTone {
  return chartHueTone(theme, 9);
}
