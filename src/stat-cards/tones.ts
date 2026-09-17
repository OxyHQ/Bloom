import {
  ACCENT_TABLE,
  DANGER_TABLE,
  colorRamp,
  mixColor,
  resolveButtonRamps,
  type Ramp,
} from '../button/shared';
import { oklchToSrgb, srgbToOklch, srgbToRgbString, type Oklch } from '../theme/color-space';
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

/** OKLCH → `rgb()`, reducing chroma until the colour fits sRGB (hue-stable). */
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

function rotatedFromPrimary(primary: string, target: Oklch): string {
  const rgba = parseRgba(primary);
  if (!rgba) return primary;
  const base = srgbToOklch(rgba);
  return toRgb({
    l: Math.min(0.99, Math.max(0.05, base.l + (target.l - BLUE_500.l))),
    c: base.c * (target.c / BLUE_500.c),
    h: (((base.h + (target.h - BLUE_500.h)) % 360) + 360) % 360,
  });
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

/**
 * The `status-lime` / `status-rose` pair over a known surface:
 * light `200` fill with `800` text, dark `950` at 60% with `500` text.
 */
export function statusPair(
  theme: Theme,
  tone: 'lime' | 'rose',
  surface: string,
): { background: string; foreground: string } {
  const ramp = roleRamp(theme, tone);
  return theme.isDark
    ? { background: mixColor(surface, ramp[950], 0.6), foreground: ramp[500] }
    : { background: ramp[200], foreground: ramp[800] };
}

/**
 * The surface tokens a dashboard card is built from, on Bloom's ramps:
 *
 *                               light          dark
 *   background-secondary        neutral-100    neutral-900
 *   background-inner            white (card)   neutral-800 @60% over the card
 *   background-primary          white (card)   neutral-800
 *   stat-card-icon-background   white (card)   neutral-800
 *   avatar-neutral-background   neutral-300    neutral-800
 *   border-button-default       neutral-200    neutral-700
 *   text-primary                text           text
 *   text-secondary              neutral-500    neutral-500
 *   foreground-icon-primary     text           text
 *   foreground-icon-secondary   neutral-500    neutral-500
 *   border-focus-ring           accent-500     accent-500
 *   shadow-card                 0 1 1 black/5  0 1 1 black/14
 */
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

export function resolveDashboardSurfaces(theme: Theme): DashboardSurfaces {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const secondary = theme.isDark ? n[900] : n[100];
  const white = theme.colors.card;
  return {
    secondary,
    inner: theme.isDark ? mixColor(secondary, n[800], 0.6) : white,
    primary: theme.isDark ? n[800] : white,
    iconTile: theme.isDark ? n[800] : white,
    avatarNeutral: theme.isDark ? n[800] : n[300],
    buttonBorder: theme.isDark ? n[700] : n[200],
    text: theme.colors.text,
    textSecondary: n[500],
    iconSecondary: n[500],
    focusRing: accent[500],
    cardShadow: theme.isDark ? '0 1px 1px 0 rgb(0 0 0 / 0.14)' : '0 1px 1px 0 rgb(0 0 0 / 0.05)',
  };
}
