import { resolveButtonRamps } from '../button/shared';
import { TYPE_SCALE, type TypeScaleVariant } from '../typography/scale';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import { pressedSurface } from '../theme/press-colors';
import type { Theme } from '../theme/types';
import { resolveChipHueColors } from './hue-colors';
import type { ChipHue, ChipSize, ChipVariant } from './types';

/**
 * `Chip`'s rungs and paint, pure so a gate can walk them without rendering.
 *
 *            height  padding-x  gap  icon  text
 *   small    24      6          4    14    caption-1-medium
 *   medium   24      6          4    16    body-medium         ← default
 *   large    28      6          4    16    body-medium
 *   xl       32      12         8    16    body-medium
 *   2xl      40      16         8    18    body-medium
 *
 * The scale used to stop at `large`, which is why FIVE families grew their own
 * pill rather than use this one: 28 tall with 6px sides is a TAG, and a filter
 * you tap needs a target. `xl` is the filter/segment row (the pill
 * `media-shelf`, `music-library` and `stay-search` each re-drew at 32); `2xl`
 * is the filters-sheet pill, tall enough for touch, with the `minWidth` that
 * keeps a one-character label ("1", "8+") from collapsing to a dot.
 */
export interface ChipGeometry {
  height: number;
  type: TypeScaleVariant;
  paddingHorizontal: number;
  iconGap: number;
  /** The icon slot's box. Defaults to 1.15 of the label's font size. */
  icon: number;
  /** Floor on the pill's width, or 0. A rung with one CENTRES its contents. */
  minWidth: number;
}

function rung(
  height: number,
  type: TypeScaleVariant,
  paddingHorizontal: number,
  iconGap: number,
  minWidth = 0,
  icon = Math.round(TYPE_SCALE[type].fontSize * 1.15),
): ChipGeometry {
  return { height, type, paddingHorizontal, iconGap, icon, minWidth };
}

export const CHIP_GEOMETRY: Readonly<Record<ChipSize, ChipGeometry>> = {
  small: rung(24, 'caption-1-medium', 6, 4),
  medium: rung(24, 'body-medium', 6, 4),
  large: rung(28, 'body-medium', 6, 4),
  xl: rung(32, 'body-medium', 12, 8),
  '2xl': rung(40, 'body-medium', 16, 8, 48, 18),
};

export interface ChipPaint {
  background: string;
  foreground: string;
  border: string;
  /** Border width the variant draws. */
  borderWidth: number;
  /** What the surface becomes while the chip is held. */
  pressedBackground: string;
  /** What the BORDER becomes under a web pointer, or `null` for no hover border change. */
  hoveredBorder: string | null;
}

/**
 * Resolve every colour one chip paints, for one tone at one loudness in one
 * selection state.
 *
 * `solid` / `subtle` / `outlined` go through the shared accent recipe, and
 * selection promotes the chip to the BRAND tone — the filter-pill behaviour.
 *
 * `inverted` is the fourth, and it is a different idea rather than a fourth
 * loudness: at rest it is a hairline on the page, and selected it turns the
 * page's own reading pair OVER (fill `text`, label `background`). That pair is
 * legible by construction in both modes and under every preset, which is what
 * a filters sheet needs and what a brand-tone promotion cannot promise. It is
 * the pill `stay-filters` used to draw itself.
 */
export function resolveChipPaint(
  theme: Theme,
  {
    tone,
    variant,
    selected,
    hue,
    surface,
  }: { tone: AccentTone; variant: ChipVariant; selected: boolean; hue?: ChipHue; surface?: string },
): ChipPaint {
  if (variant === 'inverted') {
    const { neutral } = resolveButtonRamps(theme);
    const text = theme.colors.text;
    if (selected) {
      const pressed = pressedSurface(theme.colors, text, theme.colors.background);
      return {
        background: text,
        foreground: theme.colors.background,
        border: text,
        borderWidth: 1,
        pressedBackground: pressed,
        hoveredBorder: text,
      };
    }
    return {
      background: 'transparent',
      foreground: text,
      border: theme.isDark ? neutral[700] : neutral[200],
      borderWidth: 1,
      pressedBackground: theme.isDark ? neutral[800] : neutral[100],
      hoveredBorder: text,
    };
  }

  const colors =
    !hue || selected
      ? resolveAccentColors(theme.colors, selected ? 'primary' : tone, variant)
      : { ...resolveChipHueColors(theme, hue, surface), border: 'transparent' };

  return {
    background: colors.background,
    foreground: colors.foreground,
    border: colors.border,
    borderWidth: variant === 'outlined' && !(hue && !selected) ? 1 : 0,
    // All three fills go through the one resolver and land somewhere different
    // because their REST surfaces do: `solid` keeps its tone and gains a state
    // layer of its own label colour, `subtle` deepens the tint AND its alpha
    // rather than flattening it, `outlined` has no fill so the press IS the fill.
    pressedBackground: pressedSurface(theme.colors, colors.background, colors.foreground),
    hoveredBorder: null,
  };
}

/** The keyboard focus ring every Bloom control draws: the accent ramp's 500. */
export function resolveChipRing(theme: Theme): string {
  return resolveButtonRamps(theme).accent[500];
}

export interface ChipRowScroll {
  /** Scroll offset. */
  x: number;
  /** Visible width. */
  viewport: number;
  /** Scrollable content width. */
  content: number;
}

/**
 * Whether there is more of a scrolling pill row to each side. 1px slack for
 * fractional offsets.
 *
 * `CategoryBar` re-exports this as `categoryBarOverflow`: one answer, so the
 * strip and the pill row cannot disagree about when an edge fade is up.
 */
export function chipRowOverflow({ x, viewport, content }: ChipRowScroll): {
  previous: boolean;
  next: boolean;
} {
  if (viewport <= 0 || content <= viewport + 1) return { previous: false, next: false };
  return { previous: x > 1, next: x < content - viewport - 1 };
}
