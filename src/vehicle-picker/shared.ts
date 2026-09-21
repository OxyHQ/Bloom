import type { VehicleOption } from './types';

/**
 * What a vehicle card ANNOUNCES.
 *
 * The card draws four things a name computation cannot reach: the capacity
 * line, the chips under the hairline, the price and — the one that matters —
 * the reason a blocked option is blocked. A user who cannot see the dimming has
 * to be told, in the control's own name, that this row is out and why.
 *
 * The price is read WITH its label ("From €8.90"): a bare amount inside a
 * sentence of capacities reads as another measurement.
 *
 * Pure, and exported so the join can be walked without a render.
 */
export function vehicleOptionName(
  option: Pick<VehicleOption<string>, 'label' | 'capacity' | 'priceFrom'>,
  parts: { from: string; reason?: string },
): string {
  const price =
    option.priceFrom === undefined || option.priceFrom === ''
      ? undefined
      : `${parts.from} ${option.priceFrom}`;
  return [option.label, option.capacity, price, parts.reason]
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(', ');
}
