import { surfaceFillOn } from '../styles/surface-levels';
import {
  ACCENT_TABLE,
  DANGER_TABLE,
  colorRamp,
  resolveButtonRamps,
  type Ramp,
} from '../button/shared';
import { srgbToOklch, type Oklch, oklchToRgbString } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';

/**
 * The Tailwind hues the dashboard and medical blocks hardcode, resolved
 * onto Bloom's theme. Shared by `stat-cards` and `important-alerts-card`.
 *
 * A hue with a theme role takes that role's ramp (`colorRamp`), so a preset that
 * moves `success` moves every emerald/lime surface with it:
 *
 *   blue            primary                         (accent ramp)
 *   emerald, lime   success   + ACCENT_TABLE
 *   orange, amber   warning   + ACCENT_TABLE
 *   sky             info      + ACCENT_TABLE
 *   rose            negative  + DANGER_TABLE
 *
 * Purple, pink and teal have no role. They keep Tailwind's OFFSET from
 * `blue-500` — lightness step, chroma ratio, hue distance — measured from the
 * theme's primary, the same re-anchoring `agent-limits-card` uses for its chart
 * tones. On a blue preset that reproduces Tailwind's value; on any other preset
 * the three rotate with the brand instead of clashing with it.
 */
export type DashboardTone =
  | 'blue'
  | 'orange'
  | 'amber'
  | 'purple'
  | 'pink'
  | 'sky'
  | 'emerald'
  | 'teal'
  | 'lime'
  | 'rose';

type ToneStop = 200 | 400 | 500 | 600 | 800 | 950;

/** Tailwind v4 `blue-500`, the anchor every role-less tone is measured from. */
const BLUE_500: Oklch = { l: 0.623, c: 0.214, h: 259.815 };

/** Tailwind v4 OKLCH for the stops the role-less tones are used at. */
const UNROLED: Record<'purple' | 'pink' | 'teal', Partial<Record<ToneStop, Oklch>>> = {
  purple: {
    400: { l: 0.714, c: 0.203, h: 305.504 },
    500: { l: 0.627, c: 0.265, h: 303.9 },
    600: { l: 0.558, c: 0.288, h: 302.321 },
  },
  pink: {
    400: { l: 0.718, c: 0.202, h: 349.761 },
    500: { l: 0.656, c: 0.241, h: 354.308 },
    600: { l: 0.592, c: 0.249, h: 0.584 },
  },
  teal: {
    400: { l: 0.777, c: 0.152, h: 181.912 },
    500: { l: 0.704, c: 0.14, h: 182.503 },
    600: { l: 0.6, c: 0.118, h: 184.704 },
  },
};

/**
 * `color` moved by Tailwind's offset from `anchor` to `target`: the lightness
 * step, the chroma ratio and the hue distance. When `color` IS the anchor (a
 * blue primary measured from `blue-500`) the result is `target` itself; on any
 * other theme the target keeps its place relative to the colour it was
 * measured from.
 */
export function reanchored(color: string, anchor: Oklch, target: Oklch): string {
  const rgba = parseRgba(color);
  if (!rgba) return color;
  const base = srgbToOklch(rgba);
  return oklchToRgbString({
    l: Math.min(0.99, Math.max(0.05, base.l + (target.l - anchor.l))),
    c: base.c * (target.c / anchor.c),
    h: (((base.h + (target.h - anchor.h)) % 360) + 360) % 360,
  });
}

function rotatedFromPrimary(primary: string, target: Oklch): string {
  return reanchored(primary, BLUE_500, target);
}

function roleRamp(theme: Theme, tone: Exclude<DashboardTone, 'purple' | 'pink' | 'teal'>): Ramp {
  switch (tone) {
    case 'blue':
      return resolveButtonRamps(theme).accent;
    case 'emerald':
    case 'lime':
      return colorRamp(theme.colors.success, ACCENT_TABLE);
    case 'orange':
    case 'amber':
      return colorRamp(theme.colors.warning, ACCENT_TABLE);
    case 'sky':
      return colorRamp(theme.colors.info, ACCENT_TABLE);
    case 'rose':
      return colorRamp(theme.colors.negative, DANGER_TABLE);
  }
}

/** One stop of a dashboard tone, e.g. `toneColor(theme, 'rose', 600)` for `bg-rose-600`. */
export function toneColor(theme: Theme, tone: DashboardTone, stop: ToneStop): string {
  if (tone === 'purple' || tone === 'pink' || tone === 'teal') {
    const target = UNROLED[tone][stop] ?? UNROLED[tone][500]!;
    return rotatedFromPrimary(theme.colors.primary, target);
  }
  return roleRamp(theme, tone)[stop];
}

/** Canonical status pairs; the foreground is authored with its subtle fill. */
export function statusPair(
  theme: Theme,
  tone: 'lime' | 'rose',
  _surface: string,
): { background: string; foreground: string } {
  const c = theme.colors;
  return tone === 'lime'
    ? { background: c.successSubtle, foreground: c.successSubtleForeground }
    : { background: c.errorSubtle, foreground: c.errorSubtleForeground };
}

/** Shared dashboard chrome follows canonical theme roles, independent of data hues. */
export interface DashboardSurfaces {
  secondary: string;
  inner: string;
  primary: string;
  iconTile: string;
  avatarNeutral: string;
  buttonBorder: string;
  text: string;
  textSecondary: string;
  iconSecondary: string;
  focusRing: string;
  cardShadow: string;
}

export function resolveDashboardSurfaces(
  theme: Theme,
  fill = theme.colors.card,
): DashboardSurfaces {
  const c = theme.colors;
  return {
    secondary: fill,
    inner: surfaceFillOn(theme, fill),
    primary: fill,
    iconTile: c.backgroundTertiary,
    avatarNeutral: c.backgroundTertiary,
    buttonBorder: c.borderLight,
    text: c.text,
    textSecondary: c.textSecondary,
    iconSecondary: c.textSecondary,
    focusRing: c.primary,
    cardShadow: theme.isDark ? '0 1px 1px 0 rgb(0 0 0 / 0.14)' : '0 1px 1px 0 rgb(0 0 0 / 0.05)',
  };
}
