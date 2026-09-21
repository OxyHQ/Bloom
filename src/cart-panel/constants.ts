import type { CartDensity } from './types';

export interface CartGeometry {
  /** The line's square thumbnail. */
  thumb: number;
  /** Its corner. */
  thumbRadius: number;
  /** The vendor header's round tile. */
  vendorTile: number;
}

/**
 * 56 is the basket rung: a line carries a name, its options and a price, which
 * is three text lines, and a 56 square is exactly as tall as those three — the
 * picture and the words end together. The menu's own 72 belongs to a row that
 * also carries a two-line description.
 */
export const CART_GEOMETRY: Record<CartDensity, CartGeometry> = {
  comfortable: { thumb: 56, thumbRadius: 10, vendorTile: 40 },
  compact: { thumb: 44, thumbRadius: 8, vendorTile: 32 },
};

/** Between the basket's blocks: the lines, the tip, the promo, the totals. */
export const CART_BLOCK_GAP = 20;

/** Between two lines. */
export const CART_LINE_GAP = 4;

/** The minimum-order bar's height. The `Meter` default, written down so the doc can name it. */
export const CART_METER_HEIGHT = 6;

/** How far a sold-out line's photo is washed toward the panel. */
export const CART_WASH_OPACITY = 0.5;

/** What the options line joins the chosen options with. */
export const CART_OPTION_SEPARATOR = ' · ';
