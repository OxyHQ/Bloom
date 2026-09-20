import { mixColor, resolveButtonRamps } from '../button/shared';
import { purpleChip } from '../chart-cards/ai-profile-hues';
import { toneColor } from '../stat-cards/tones';
import type { Theme } from '../theme/types';
import type { ChipHue } from './types';

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
 *   neutral  background-tertiary / text-secondary   neutral-200 | 800 / neutral-500
 *   gray     background-secondary / text-primary    neutral-100 | 900 / text
 *   soft     background-secondary / text-secondary  neutral-100 | 900 / neutral-500
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
      return { background: theme.colors.backgroundTertiary, foreground: theme.colors.textSecondary };
    case 'gray':
      return { background: theme.colors.backgroundSecondary, foreground: theme.colors.text };
    case 'soft':
      return { background: theme.colors.backgroundSecondary, foreground: theme.colors.textSecondary };
    case 'purple':
      return purpleChip(theme, surface);
    default: {
      const stop = (s: 200 | 400 | 500 | 800 | 950) => (hue === 'blue' ? accent[s] : toneColor(theme, HUE_TONE[hue], s));
      if (!theme.isDark) return { background: stop(200), foreground: stop(800) };
      const foreground = hue === 'blue' ? accent[300] : hue === 'cyan' ? stop(400) : stop(500);
      return { background: mixColor(surface, stop(950), 0.6), foreground };
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

/** Actual page behind data-category chips. */
export function chipPageSurface(theme: Theme): string {
  return theme.colors.background;
}
