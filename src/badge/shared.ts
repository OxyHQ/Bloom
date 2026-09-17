import { resolveButtonRamps } from '../button/shared';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import type { TypeScaleVariant } from '../typography/scale';
import type { BadgeSize, BadgeVariant } from './types';

/**
 * `Badge`'s rungs and paint, pure so a gate can walk the whole preset x mode
 * matrix without rendering.
 *
 * TWO FAMILIES OF RUNG, and the difference is not decoration:
 *
 *   COUNTER   small / medium / large — sized to a DIGIT. `minWidth` equals the
 *             height so "3" stays a circle rather than a pill narrower than it
 *             is tall, and the pill never shrinks: it is a fixed token in the
 *             row it sits in.
 *   LABEL     `label-small` / `label-medium` — sized to a WORD, with the side
 *             padding a word needs (8 / 10 rather than 4) and a leading icon
 *             slot. These SHRINK and truncate, because a two-word status in a
 *             narrow card must yield before the card's title does.
 *
 * The label rungs are where the housing badges live — `OfferingBadge` and the
 * listing status pill are presets over them rather than two more copies of this
 * geometry.
 *
 *                   height  padding-x  icon  gap  text
 *   small           17      4          10    2    caption-2-semibold
 *   medium          18      4          11    2    caption-1-semibold  ← default
 *   large           24      6          14    4    body-semibold
 *   label-small     20      8          12    4    caption-1-semibold
 *   label-medium    24      10         14    4    body-2-semibold
 */
export interface BadgeGeometry {
  height: number;
  type: TypeScaleVariant;
  /** Side padding. An icon tucks the LEADING side in by 2, optically. */
  paddingHorizontal: number;
  /** The leading icon's box. */
  icon: number;
  /** Between the icon and the label. */
  gap: number;
  /** Standalone status dot: tint halo around a solid centre. */
  dotSize: number;
  halo: number;
  core: number;
  /**
   * `true` for the rungs sized to a word: they shrink and truncate. `false` for
   * the counter rungs, which pin `minWidth` to the height and never shrink.
   */
  word: boolean;
}

export const BADGE_GEOMETRY: Readonly<Record<BadgeSize, BadgeGeometry>> = {
  small: { height: 17, type: 'caption-2-semibold', paddingHorizontal: 4, icon: 10, gap: 2, dotSize: 6, halo: 8, core: 4, word: false },
  medium: { height: 18, type: 'caption-1-semibold', paddingHorizontal: 4, icon: 11, gap: 2, dotSize: 8, halo: 12, core: 6, word: false },
  large: { height: 24, type: 'body-semibold', paddingHorizontal: 6, icon: 14, gap: 4, dotSize: 10, halo: 16, core: 8, word: false },
  'label-small': { height: 20, type: 'caption-1-semibold', paddingHorizontal: 8, icon: 12, gap: 4, dotSize: 8, halo: 12, core: 6, word: true },
  'label-medium': { height: 24, type: 'body-2-semibold', paddingHorizontal: 10, icon: 14, gap: 4, dotSize: 10, halo: 16, core: 8, word: true },
};

export interface BadgePaint {
  background: string;
  /** Label AND icon. One colour: a badge's icon is a glyph of its label, not a second accent. */
  foreground: string;
  border: string;
  /** `bloomShadowStyle` step, or `null` for a flat badge. */
  shadow: 's' | null;
}

/**
 * The surface, label and border for one tone at one loudness.
 *
 *   solid/subtle/outlined   the shared accent recipe, unchanged — the pairs the
 *                           colour policy gates at AA, so nothing is derived here
 *   onMedia                 a neutral-50 pill with a neutral-900 label and
 *                           shadow-s, THE SAME IN BOTH MODES and ignoring `tone`:
 *                           the photograph under it does not change with the
 *                           theme, so a badge that followed the mode would go
 *                           dark-on-dark over half the images in the library
 */
export function resolveBadgePaint(theme: Theme, tone: AccentTone, variant: BadgeVariant): BadgePaint {
  if (variant === 'onMedia') {
    const { neutral } = resolveButtonRamps(theme);
    return { background: neutral[50], foreground: neutral[900], border: 'transparent', shadow: 's' };
  }
  const pair = resolveAccentColors(theme.colors, tone, variant);
  return { ...pair, shadow: null };
}
