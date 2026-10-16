import { ACCENT_TABLE, DANGER_TABLE, colorRamp, resolveButtonRamps } from '../button/shared';
import { purpleChip } from '../chart-cards/ai-profile-hues';
import { reanchored, toneColor } from '../stat-cards/tones';
import type { Oklch } from '../theme/color-space';
import type { Theme } from '../theme/types';
import type { ChipHue } from './types';
import { mixColors } from '../styles/color-contrast';

/**
 * Chip data-hue colours on Bloom's theme. These are
 * DATA hues — a category, a department, an objective — not status roles, so
 * they sit beside `resolveAccentColors` rather than inside it:
 *
 *            light                        dark
 *   lime     200 / 800                    950 @60% / 500     success ramp
 *   rose     200 / 800                    950 @60% / 500     negative ramp (danger table)
 *   yellow   200 / 800                    950 @60% / 500     warning ramp
 *   cyan     200 / 800                    950 @60% / 400     info ramp
 *   blue     200 / 800                    950 @60% / 300     accent ramp
 *   purple   100 / 600                    900 @50% / 300     Tailwind purple, re-anchored on primary
 *   orange   200 / 800                    950 @60% / 300     Tailwind orange, re-anchored on warning
 *   brown    200 / 800                    950 @60% / 300     orange at 40% of its chroma
 *   pink     200 / 800                    950 @60% / 500     Tailwind pink, re-anchored on negative
 *   neutral  background-tertiary / text-secondary   neutral-200 | 800 / neutral-500
 *   gray     background-secondary / text-primary    neutral-100 | 900 / text
 *   soft     background-secondary / text-secondary  neutral-100 | 900 / neutral-500
 *
 * Orange, brown and pink are the hues a select option's colour list needs
 * beside the rest (default, gray, brown, orange, yellow, green, blue, purple,
 * pink, red: `neutral`, `gray`, `brown`, `orange`, `yellow`, `lime`, `blue`,
 * `purple`, `pink`, `rose`). None has a theme role, and each is anchored on its
 * NEAREST role rather than on `primary`: orange and brown on `warning`, the
 * ramp `yellow` paints from, and pink on `negative`, the ramp `rose` paints
 * from. A named option has to stay that colour and stay apart from its
 * neighbour under every preset; rotating with the brand, as `purple` does,
 * would turn "pink" green on a red preset. Each keeps Tailwind's hue distance
 * and chroma ratio from the hue the role stands for (orange from `amber-500`,
 * pink from `red-500`), so a preset that moves the role moves it too, and the
 * pair never collapses into one colour. Tailwind has no brown; a brown is an orange with most of its colour taken
 * out, which is what {@link BROWN_CHROMA} says.
 *
 * Dark fills are `color-mix(… N%, transparent)`, so what paints
 * depends on what the chip sits on. React Native has no translucent-over-parent
 * mix that matches CSS, so the fill is pre-mixed over `surface` — by default
 * the page background (`background-full`: white, dark neutral-925), which is
 * where tables put their chips.
 */
export function resolveChipHueColors(
  theme: Theme,
  hue: ChipHue,
  surface: string = chipPageSurface(theme),
): { background: string; foreground: string } {
  const { accent } = resolveButtonRamps(theme);
  switch (hue) {
    case 'neutral':
      return {
        background: theme.colors.backgroundTertiary,
        foreground: theme.colors.textSecondary,
      };
    case 'gray':
      return { background: theme.colors.backgroundSecondary, foreground: theme.colors.text };
    case 'soft':
      return {
        background: theme.colors.backgroundSecondary,
        foreground: theme.colors.textSecondary,
      };
    case 'purple':
      return purpleChip(theme, surface);
    case 'orange':
    case 'brown':
    case 'pink': {
      const ramp = unroledRamp(theme, hue);
      if (!theme.isDark) return { background: ramp[200], foreground: ramp[800] };
      // Pink's label is the role's own stop, as `rose`'s is: a dark `negative`
      // is already a light tone. Warning stays dark in dark mode, so orange and
      // brown take the fixed-lightness 300 (`yellow`'s 500 measures near 3.6:1).
      const foreground = hue === 'pink' ? ramp[500] : ramp[300];
      return { background: mixColors(surface, ramp[950], 0.6), foreground };
    }
    default: {
      const stop = (s: 200 | 400 | 500 | 800 | 950) =>
        hue === 'blue' ? accent[s] : toneColor(theme, HUE_TONE[hue], s);
      if (!theme.isDark) return { background: stop(200), foreground: stop(800) };
      const foreground = hue === 'blue' ? accent[300] : hue === 'cyan' ? stop(400) : stop(500);
      return { background: mixColors(surface, stop(950), 0.6), foreground };
    }
  }
}

/** The theme ramp each status hue borrows (see `stat-cards/tones.ts`). */
const HUE_TONE = {
  lime: 'lime',
  rose: 'rose',
  yellow: 'amber',
  cyan: 'sky',
} as const;

/** Tailwind v4 `amber-500`: what the `warning` role stands for. */
const AMBER_500: Oklch = { l: 0.769, c: 0.188, h: 70.08 };
/** Tailwind v4 `orange-500`. */
const ORANGE_500: Oklch = { l: 0.705, c: 0.213, h: 47.604 };
/** Tailwind v4 `red-500`: what the `negative` role stands for. */
const RED_500: Oklch = { l: 0.637, c: 0.237, h: 25.331 };
/** Tailwind v4 `pink-500`. */
const PINK_500: Oklch = { l: 0.656, c: 0.241, h: 354.308 };

/**
 * How much of orange's chroma a brown keeps. At 0.4 the label (800) sits near
 * 0.08 chroma and the fill (200) near 0.02: plainly warm against `gray`, and
 * plainly not `orange` beside it.
 */
const BROWN_CHROMA = 0.4;
const BROWN_500: Oklch = { ...ORANGE_500, c: ORANGE_500.c * BROWN_CHROMA };

/** The ramp a role-less select hue paints from; see the table above. */
function unroledRamp(theme: Theme, hue: 'orange' | 'brown' | 'pink') {
  if (hue === 'pink')
    return colorRamp(reanchored(theme.colors.negative, RED_500, PINK_500), DANGER_TABLE);
  const target = hue === 'orange' ? ORANGE_500 : BROWN_500;
  return colorRamp(reanchored(theme.colors.warning, AMBER_500, target), ACCENT_TABLE);
}

/** Actual page behind data-category chips. */
export function chipPageSurface(theme: Theme): string {
  return theme.colors.background;
}
