import { atoms as a } from '../styles';

/** Max width 240px. */
export const BUBBLE_MAX_WIDTH = 240;
/**
 * The caret's footprint along the bubble edge (a 12×7 caret). Kept under
 * its original name — the native placement maths centres against it.
 */
export const ARROW_SIZE = 12;
export const ARROW_HALF_SIZE = ARROW_SIZE / 2;
/** How far the caret sticks out of the bubble edge. */
export const ARROW_DEPTH = 7;
export const MIN_EDGE_SPACE = a.px_lg.paddingHorizontal;

/**
 * A 10px offset: the bubble's edge sits 10px from the trigger, with the
 * 7px caret inside that gap.
 */
export const TOOLTIP_OFFSET = 10;

/** `duration-200 ease-out` enter and exit. */
export const TOOLTIP_MOTION_DURATION = 200;

export type TooltipSize = 'sm' | 'md';

/**
 * The two tooltip sizes.
 *
 *            sm                       md
 *   padding  px-2.5 py-1.5 (10/6)     px-3 py-2 (12/8)
 *   radius   rounded-lg (8)           rounded-2lg (10)
 *   text     Caption 1/Medium         Body 1/Medium
 *            12/16 500, +0.15px       14/20 500
 */
export const TOOLTIP_SIZES = {
  sm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    type: 'caption-1-medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.15,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    type: 'body-medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
} as const satisfies Record<
  TooltipSize,
  {
    paddingHorizontal: number;
    paddingVertical: number;
    borderRadius: number;
    /** The `TYPE_SCALE` step the text is set in; the three numbers below mirror it. */
    type: 'caption-1-medium' | 'body-medium';
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  }
>;
