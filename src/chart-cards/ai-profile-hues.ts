import { mixColor } from '../button/shared';
import { oklchToSrgb, srgbToOklch, srgbToRgbString, type Oklch } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';

/**
 * The purple / violet stops the AI profile template hardcodes, on the
 * theme (`AgentsChartCard`, `TokensChartCard`, `AiProfileCard`):
 *
 *                              light                dark
 *   chart-agents-bar           purple-300           purple-500
 *   chart-agents-bar-active    purple-400           purple-600
 *   tokens line / area         purple-400           purple-400
 *   tokens active dot          purple-500           purple-500
 *   status-purple (delta chip) purple-100 / 600     purple-900 @50% / 300
 *   contributions grid         violet ramp          violet ramp
 *
 * A data hue, not a status: each stop keeps Tailwind v4's lightness, with its
 * chroma ratio and hue distance from `blue-500` re-anchored on `primary` — the
 * `chartHueTone` recipe. A Tailwind-blue primary reproduces purple exactly;
 * any other preset rotates it with the brand.
 */

export type PurpleStop = 100 | 300 | 400 | 500 | 600 | 900;

/** Tailwind v4 `purple-*`, OKLCH. */
const PURPLE: Record<PurpleStop, Oklch> = {
  100: { l: 0.946, c: 0.033, h: 307.174 },
  300: { l: 0.827, c: 0.119, h: 306.383 },
  400: { l: 0.714, c: 0.203, h: 305.504 },
  500: { l: 0.627, c: 0.265, h: 303.9 },
  600: { l: 0.558, c: 0.288, h: 302.321 },
  900: { l: 0.381, c: 0.176, h: 304.987 },
};

/** Tailwind v4 `violet-500` — the contributions heatmap's `accent="violet"`. */
const VIOLET_500: Oklch = { l: 0.606, c: 0.25, h: 292.717 };

/** Tailwind v4 `blue-500`, the anchor. */
const BLUE_500: Oklch = { l: 0.623, c: 0.214, h: 259.815 };

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
    l: target.l,
    c: base.c * (target.c / BLUE_500.c),
    h: (((base.h + (target.h - BLUE_500.h)) % 360) + 360) % 360,
  });
}

/** One `purple-*` stop on the theme. */
export function purpleStop(theme: Theme, stop: PurpleStop): string {
  return fromPrimary(theme.colors.primary, PURPLE[stop]);
}

/** `violet-500` on the theme — a ramp base for `ContributionsGrid`'s `color`. */
export function violetBase(theme: Theme): string {
  return fromPrimary(theme.colors.primary, VIOLET_500);
}

/** `status-purple` over a known surface: light 100 / 600, dark 900 at 50% / 300. */
export function purpleChip(theme: Theme, surface: string): { background: string; foreground: string } {
  return theme.isDark
    ? { background: mixColor(surface, purpleStop(theme, 900), 0.5), foreground: purpleStop(theme, 300) }
    : { background: purpleStop(theme, 100), foreground: purpleStop(theme, 600) };
}
