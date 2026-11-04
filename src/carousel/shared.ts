import { resolveButtonRamps } from '../button/shared';
import type { Theme } from '../theme/types';

/** A dot's diameter, and a pill's height, px. */
export const CAROUSEL_DOT_SIZE = 6;
/** A dot at a window edge that has more slides beyond it, px. */
export const CAROUSEL_DOT_EDGE_SIZE = 4;

export interface CarouselPaint {
  dotActive: string;
  dot: string;
  dotHover: string;
  /** Every dot drawn over imagery (`appearance="onMedia"`). */
  dotOnMedia: string;
  ring: string;
}

/**
 * Every colour the carousel paints (the arrows are `Button`'s own). Pure.
 *
 *   dot active   text/primary
 *   dot          background/tertiary/default   neutral-200  (dark neutral-800)
 *   dot hover    border/button/active          neutral-400  (dark neutral-600)
 *   on media     neutral-50                    both modes — drawn over a photo
 */
export function resolveCarouselPaint(theme: Theme): CarouselPaint {
  const { accent, neutral } = resolveButtonRamps(theme);
  return {
    dotActive: theme.colors.text,
    dot: theme.colors.backgroundSecondary,
    dotHover: theme.colors.textSecondary,
    dotOnMedia: neutral[50],
    ring: accent[500],
  };
}

export interface CarouselDotSlot {
  /** The slide (or stop) this dot stands for. */
  index: number;
  /** Its diameter: {@link CAROUSEL_DOT_EDGE_SIZE} at an edge with more beyond. */
  size: number;
  active: boolean;
}

/**
 * The dots to draw for `count` slides with `active` in view: all of them up to
 * `max`, otherwise a window of `max` that follows the active slide, whose edge
 * dots shrink while more slides lie beyond them.
 */
export function carouselDotWindow(
  count: number,
  active: number,
  max: number = Number.POSITIVE_INFINITY,
): CarouselDotSlot[] {
  if (count <= 1) return [];
  const visible = Math.max(1, Math.min(count, Math.floor(max)));
  const start = Math.min(Math.max(0, active - Math.floor(visible / 2)), count - visible);
  const end = start + visible - 1;
  const slots: CarouselDotSlot[] = [];
  for (let index = start; index <= end; index++) {
    const moreBefore = index === start && start > 0;
    const moreAfter = index === end && end < count - 1;
    slots.push({
      index,
      size: moreBefore || moreAfter ? CAROUSEL_DOT_EDGE_SIZE : CAROUSEL_DOT_SIZE,
      active: index === active,
    });
  }
  return slots;
}
