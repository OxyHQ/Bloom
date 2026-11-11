import { BREAKPOINTS, type Breakpoint } from './breakpoints';

/**
 * A value that may change with the width of the box it is read against: one
 * value for every width, or a map keyed by tier. `base` applies below `sm`; a
 * tier applies from its own min-width up until a wider tier overrides it.
 *
 * `T` is a closed set of primitives (`'row' | 'column'`, a number): a map
 * is told from a plain value by being an object, so an object-valued `T` is
 * not supported.
 */
export type Responsive<T extends string | number | boolean> =
  | T
  | ({ base?: T } & Partial<Record<Breakpoint, T>>);

const TIERS = Object.keys(BREAKPOINTS) as Breakpoint[];

/** `value` at `width`: the widest tier whose min-width `width` reaches wins. */
export function resolveResponsive<T extends string | number | boolean>(
  value: Responsive<T> | undefined,
  width: number,
): T | undefined {
  if (value === undefined || typeof value !== 'object') return value;
  let result = value.base;
  for (const tier of TIERS) {
    const candidate = value[tier];
    if (candidate !== undefined && width >= BREAKPOINTS[tier]) result = candidate;
  }
  return result;
}

/**
 * The widths at which `value` changes: the min-width of every tier it names.
 * Empty for a plain value. Callers that compile one rule per width range
 * (container queries) or quantize a width (`useWidthClass`) read these.
 */
export function responsiveThresholds<T extends string | number | boolean>(
  value: Responsive<T> | undefined,
): number[] {
  if (value === undefined || typeof value !== 'object') return [];
  return TIERS.filter((tier) => value[tier] !== undefined).map((tier) => BREAKPOINTS[tier]);
}
