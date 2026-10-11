import { RiBikeLine } from '../icons/remix/RiBikeLine';
import { RiBox3Line } from '../icons/remix/RiBox3Line';
import { RiBusLine } from '../icons/remix/RiBusLine';
import { RiCarLine } from '../icons/remix/RiCarLine';
import { RiSnowflakeLine } from '../icons/remix/RiSnowflakeLine';
import type { BloomIconComponent } from '../icons/icon-component';
import { VEHICLE_PICKER_MESSAGES, type VehiclePickerMessages } from './messages';
import type { VehicleKind, VehicleOption, VehiclePickerLabels } from './types';

const BUILT_IN_ORDER: readonly VehicleKind[] = ['bike', 'car', 'van', 'boxTruck', 'refrigerated'];

/** The five built-in vehicles, smallest first, in one language's words. */
export function builtInVehicleOptions(
  messages: VehiclePickerMessages,
): readonly VehicleOption<VehicleKind>[] {
  return BUILT_IN_ORDER.map((value) => ({
    value,
    ...messages.vehicles[value],
    fits: [...messages.vehicles[value].fits],
  }));
}

/**
 * The glyph each built-in vehicle draws.
 *
 * Bloom's icon set has no truck and no van, so the two largest bodies borrow
 * the closest shapes it does have — a bus for the van (a box on wheels at road
 * scale) and a crate for the box truck (the body IS the box). The refrigerated
 * van is the snowflake rather than a second vehicle outline: what distinguishes
 * it is the temperature, not the silhouette, and two nearly identical van
 * glyphs side by side read as a drawing mistake.
 */
export const VEHICLE_ICON: Record<VehicleKind, BloomIconComponent> = {
  bike: RiBikeLine,
  car: RiCarLine,
  van: RiBusLine,
  boxTruck: RiBox3Line,
  refrigerated: RiSnowflakeLine,
};

/**
 * The five built-in vehicles, smallest first, with no prices.
 *
 * A price-from belongs to a marketplace and a moment, so the defaults carry
 * none: a picker showing invented amounts is worse than one showing the
 * capacities alone. Spread an option and add `priceFrom` where the app knows it.
 *
 * In English. A picker given no `options` draws these five in the resolved
 * locale's words instead.
 */
export const VEHICLE_OPTIONS: readonly VehicleOption<VehicleKind>[] = builtInVehicleOptions(
  VEHICLE_PICKER_MESSAGES.en,
);

/** The picker's default copy, in English. The picker speaks `VEHICLE_PICKER_MESSAGES` in the resolved locale. */
export const VEHICLE_PICKER_LABELS: Required<VehiclePickerLabels> = {
  from: VEHICLE_PICKER_MESSAGES.en.from,
  fits: VEHICLE_PICKER_MESSAGES.en.fits,
  unavailable: VEHICLE_PICKER_MESSAGES.en.unavailable,
};

/**
 * The picker's geometry, as the numbers rather than as prose.
 *
 * `gap` is the space between two option cards; `chipGap` the space inside a
 * `fits` row. `narrowWidth` is the picker's OWN width under which each card
 * drops to its compact inset — the same measurement the card itself offers,
 * taken once here so every card in one picker agrees.
 */
export const VEHICLE_PICKER_GEOMETRY = {
  gap: 12,
  chipGap: 8,
  headingGap: 16,
  narrowWidth: 400,
} as const;

export type VehiclePickerGeometry = typeof VEHICLE_PICKER_GEOMETRY;
