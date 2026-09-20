import type { OrderStatusDensity, OrderStatusStepState } from './types';
import type { TypeScaleVariant } from '../typography/scale';

/** What a screen reader says for each state, before the step's own label. */
export const ORDER_STATUS_STATE_LABELS: Record<OrderStatusStepState, string> = {
  done: 'Done',
  current: 'In progress',
  upcoming: 'Not yet',
  failed: 'Failed',
};

export interface OrderStatusGeometry {
  /** The marker column's width (vertical) / the marker's own box (horizontal). */
  column: number;
  /** A plain marker's diameter. */
  dot: number;
  /** How much wider a `current` marker is, for its halo. */
  halo: number;
  /** The connector's thickness. */
  line: number;
  /** The text line the marker is centred against. */
  lead: number;
  /** Vertical: space between one step and the next. Horizontal: rail to label. */
  gap: number;
  /** The glyph inside a marker that has one. `0` means the density draws none. */
  glyph: number;
  label: TypeScaleVariant;
  labelStrong: TypeScaleVariant;
  meta: TypeScaleVariant;
}

/**
 * The two rungs, per orientation. Written out rather than derived: a horizontal
 * rail's label sits UNDER a marker and has a column's width to fit in, so it is
 * a step smaller than the vertical label at the same density, and a formula
 * that produced that would be a formula fitted to four numbers.
 */
export const ORDER_STATUS_GEOMETRY: Record<
  'vertical' | 'horizontal',
  Record<OrderStatusDensity, OrderStatusGeometry>
> = {
  vertical: {
    comfortable: {
      column: 24,
      dot: 12,
      halo: 6,
      line: 2,
      lead: 20,
      gap: 20,
      glyph: 14,
      label: 'body-medium',
      labelStrong: 'body-semibold',
      meta: 'body-2-regular',
    },
    compact: {
      column: 16,
      dot: 8,
      halo: 4,
      line: 2,
      lead: 18,
      gap: 12,
      glyph: 0,
      label: 'body-2-medium',
      labelStrong: 'body-2-semibold',
      meta: 'caption-1-regular',
    },
  },
  horizontal: {
    comfortable: {
      column: 24,
      dot: 12,
      halo: 6,
      line: 2,
      lead: 16,
      gap: 8,
      glyph: 14,
      label: 'caption-1-medium',
      labelStrong: 'caption-1-semibold',
      meta: 'caption-2-regular',
    },
    compact: {
      column: 16,
      dot: 8,
      halo: 4,
      line: 2,
      lead: 15,
      gap: 6,
      glyph: 0,
      label: 'caption-2-medium',
      labelStrong: 'caption-2-semibold',
      meta: 'caption-2-regular',
    },
  },
};

/** The leading tile `OrderStatusBar` draws a glyph in. */
export const ORDER_STATUS_BAR_TILE = 40;
export const ORDER_STATUS_BAR_GLYPH = 20;
export const ORDER_STATUS_BAR_PADDING = 14;
export const ORDER_STATUS_BAR_METER_HEIGHT = 6;
