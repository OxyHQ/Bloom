import type { GuestCounts, GuestKind } from './types';

/**
 * The one guest rule: a booking with any children, infants or pets needs at
 * least one adult. Returns the minimum `adults` may take for `value`.
 */
export function minimumAdults(value: GuestCounts): number {
  return value.children + value.infants + value.pets > 0 ? 1 : 0;
}

/**
 * Set one guest count and apply the rule: adding a child, infant or pet while
 * there are no adults also sets adults to 1. Counts are clamped at 0.
 * Pure — `GuestPicker` calls it, and an app can call it for its own controls.
 */
export function applyGuestCount(value: GuestCounts, kind: GuestKind, count: number): GuestCounts {
  const next: GuestCounts = { ...value, [kind]: Math.max(0, count) };
  const floor = minimumAdults(next);
  if (next.adults < floor) next.adults = floor;
  return next;
}
