/**
 * What a checkout summary paints, read RELATIVE to the surface it was dropped
 * on (`styles/surface-levels.ts`): the review is a page on a phone, a column
 * beside a basket on a desktop, and a sheet over a menu — three different
 * fills, and a tile colour picked by eye vanishes on one of them.
 *
 * Pure, so `CheckoutSummary.test.tsx` can walk presets and modes without
 * rendering.
 */
import { surfaceFillOn, surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { CHECKOUT_AMOUNT_SEPARATOR } from './constants';

export interface CheckoutSummaryPaint extends SurfaceTextPaint {
  /** The round tile a row's glyph sits in — one step off the group's own fill. */
  tile: string;
}

export function resolveCheckoutPaint(theme: Theme, surface: string): CheckoutSummaryPaint {
  return {
    ...surfaceTextOn(theme, surface),
    tile: surfaceFillOn(theme, surface),
  };
}

/**
 * The row's announced name: the label, then whatever the row is showing.
 *
 * Deliberately "Delivery window: Today, 17:00 – 19:00" and not "Change
 * delivery window" — a reader moving through the summary wants the DECISIONS
 * read back, and what the press does belongs in the hint.
 */
export function checkoutRowName(label: string, value: string | undefined): string {
  return value && value !== '' ? `${label}: ${value}` : label;
}

/** "Place order" + "€24.80" → "Place order · €24.80". */
export function checkoutConfirmLabel(label: string, amount: string | undefined): string {
  return amount && amount !== '' ? `${label}${CHECKOUT_AMOUNT_SEPARATOR}${amount}` : label;
}
