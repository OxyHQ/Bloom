import type { TextStyle } from 'react-native';

import { ACCENT_TABLE, colorRamp, type RampTable } from '../button/shared';
import { TYPE_SCALE } from '../typography/scale';
import { parseRgba } from '../theme/color-utils';
import { srgbToOklch } from '../theme/color-space';
import type { Theme } from '../theme/types';
import type { AvatarColor, AvatarSizeToken } from './types';

/**
 * The initials disc.
 *
 *   rung   px   initials
 *   xs     20   10/15 semibold
 *   sm     24   caption-1-semibold, tracking 0 (12/16)
 *   md     32   headline-semibold (16/22)
 *   lg     36   18/24 semibold
 *
 *   tint      disc                 initials
 *   neutral   neutral-300          text-secondary (neutral-500)
 *             (dark: neutral-800)
 *   blue      blue-300             blue-900         ← theme `primary`
 *   lime      lime-200             lime-700         ← theme `success`
 *   pink      pink-200             pink-500         ← theme `negative`
 *
 * The hue tints are not repainted in dark mode.
 */
export const AVATAR_SIZES: Record<AvatarSizeToken, number> = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 36,
};

/** A numeric size, or a rung resolved to its pixels. */
export function resolveAvatarSize(size: number | AvatarSizeToken | undefined): number {
  if (size == null) return 40;
  return typeof size === 'number' ? size : AVATAR_SIZES[size];
}

/**
 * The initials' type. Four rungs exactly; between rungs the next rung
 * up; above `lg` (40 is the notification avatar, which keeps `lg`'s type)
 * the letter scales with the disc, since there is no type defined past that size.
 */
export function avatarInitialsType(size: number): TextStyle {
  if (size <= 20) return { fontSize: 10, lineHeight: 15, fontWeight: '600', letterSpacing: 0 };
  if (size <= 24) return { ...TYPE_SCALE['caption-1-semibold'], letterSpacing: 0 };
  if (size <= 32) return { ...TYPE_SCALE['headline-semibold'] };
  if (size <= 40) return { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: 0 };
  return {
    fontSize: Math.round(size * 0.45),
    lineHeight: Math.round(size * 0.6),
    fontWeight: '600',
    letterSpacing: 0,
  };
}

/** Tailwind v4 `lime-*` (L, C) — the ramp shape the lime tint is read from. */
const LIME_TABLE: RampTable = {
  50: [0.986, 0.031], 100: [0.967, 0.067], 200: [0.938, 0.127], 300: [0.897, 0.196],
  400: [0.841, 0.238], 500: [0.768, 0.233], 600: [0.648, 0.2], 700: [0.532, 0.157],
  800: [0.453, 0.124], 900: [0.405, 0.101], 950: [0.274, 0.072],
};

/** Tailwind v4 `pink-*` (L, C). */
const PINK_TABLE: RampTable = {
  50: [0.971, 0.014], 100: [0.948, 0.028], 200: [0.899, 0.061], 300: [0.823, 0.12],
  400: [0.718, 0.202], 500: [0.656, 0.241], 600: [0.592, 0.249], 700: [0.525, 0.223],
  800: [0.459, 0.187], 900: [0.408, 0.153], 950: [0.284, 0.109],
};

/**
 * `colorRamp` with EVERY stop at the table's own lightness. `colorRamp` keeps
 * the 400/600/700 stops at a lightness OFFSET from the theme colour (right for
 * a gradient pair), which for lime — whose 500 sits far lighter than a theme's
 * `success` — would sink `lime-700` to near-black. Pinning the table's 500 to
 * the colour's own lightness turns every offset back into the absolute value.
 */
function absoluteRamp(color: string, table: RampTable) {
  const rgba = parseRgba(color);
  if (!rgba) return colorRamp(color, table);
  const { l } = srgbToOklch(rgba);
  return colorRamp(color, { ...table, 500: [l, table[500][1]] });
}

export interface AvatarTint {
  background: string;
  foreground: string;
}

/** Every colour one tint paints. Pure, so it can be walked over presets. */
export function resolveAvatarTint(theme: Theme, color: AvatarColor): AvatarTint {
  switch (color) {
    case 'blue': {
      const ramp = colorRamp(theme.colors.primary, ACCENT_TABLE);
      return { background: ramp[300], foreground: ramp[900] };
    }
    case 'lime': {
      const ramp = absoluteRamp(theme.colors.success, LIME_TABLE);
      return { background: ramp[200], foreground: ramp[700] };
    }
    case 'pink': {
      // `negative`, not `tertiary`: a preset's tertiary can be a pale yellow,
      // which leaves no legible initial on its own 200 stop. Rose is pink's
      // nearest theme role. The 500 stop IS the theme colour.
      const ramp = absoluteRamp(theme.colors.negative, PINK_TABLE);
      return { background: ramp[200], foreground: ramp[500] };
    }
    case 'neutral':
    default: {
      return { background: theme.colors.backgroundTertiary, foreground: theme.colors.textSecondary };
    }
  }
}

const NAME_TINTS: readonly AvatarColor[] = ['blue', 'lime', 'pink', 'neutral'];

/** The same name always lands on the same tint. */
export function avatarTintForName(name: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return NAME_TINTS[Math.abs(hash) % NAME_TINTS.length] ?? 'neutral';
}

/** The first grapheme-ish code point of a name, upper-cased. */
export function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const firstCodePoint = [...trimmed][0] ?? '?';
  return firstCodePoint.toUpperCase();
}
