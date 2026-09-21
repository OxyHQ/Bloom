/**
 * What the picker paints, and the two joins that decide what a screen reader
 * says about a window.
 *
 * The paint is read RELATIVE to the surface the picker was dropped on
 * (`styles/surface-levels.ts`): a delivery picker is a step of a checkout page,
 * a sheet over a basket and a panel beside a map, and an option border picked
 * by eye disappears on one of the three.
 *
 * Pure, so `DeliverySlot.test.tsx` can walk presets and modes without
 * rendering.
 */
import { hairlineOn, surfaceFillOn, surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { DELIVERY_DETAIL_SEPARATOR, DELIVERY_SOLD_OUT_LABEL, DELIVERY_TIER_LABELS } from './constants';
import type { DeliveryTier, DeliveryWindow } from './types';

export interface DeliverySlotPaint extends SurfaceTextPaint {
  /** An unchosen option's border. */
  border: string;
  /** The chosen option's wash. */
  selected: string;
}

export function resolveDeliverySlotPaint(theme: Theme, surface: string): DeliverySlotPaint {
  return {
    ...surfaceTextOn(theme, surface),
    border: hairlineOn(theme, surface),
    selected: surfaceFillOn(theme, surface),
  };
}

/** Joins the non-empty parts of a line with the family's separator. */
export function joinDeliveryParts(
  parts: ReadonlyArray<string | false | null | undefined>,
  separator: string = DELIVERY_DETAIL_SEPARATOR,
): string | undefined {
  const joined = parts
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(separator);
  return joined === '' ? undefined : joined;
}

/**
 * The line under a window: what class of service it is, and what is left of it.
 *
 * A SOLD-OUT window says only that. The tier and the capacity of a window
 * nobody can take are facts about a thing that is not on offer, and reading
 * them out after "Sold out" is how a reader ends up tapping it.
 */
export function windowDetail(
  window: DeliveryWindow,
  tierLabels: Partial<Record<DeliveryTier, string>> = {},
  soldOutLabel: string = DELIVERY_SOLD_OUT_LABEL,
): string | undefined {
  if (window.soldOut) return soldOutLabel;
  const words = { ...DELIVERY_TIER_LABELS, ...tierLabels };
  return joinDeliveryParts([words[window.tier ?? 'standard'], window.capacity, window.note]);
}

/** The window's announced name: the window, then everything true about it. */
export function windowName(
  window: DeliveryWindow,
  tierLabels?: Partial<Record<DeliveryTier, string>>,
  soldOutLabel?: string,
): string {
  return (
    window.accessibilityLabel ??
    joinDeliveryParts([window.label, windowDetail(window, tierLabels, soldOutLabel), window.price]) ??
    window.label
  );
}
