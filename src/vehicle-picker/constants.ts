import { RiBikeLine } from '../icons/remix/RiBikeLine';
import { RiBox3Line } from '../icons/remix/RiBox3Line';
import { RiBusLine } from '../icons/remix/RiBusLine';
import { RiCarLine } from '../icons/remix/RiCarLine';
import { RiSnowflakeLine } from '../icons/remix/RiSnowflakeLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { VehicleKind, VehicleOption, VehiclePickerLabels } from './types';

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
 */
export const VEHICLE_OPTIONS: readonly VehicleOption<VehicleKind>[] = [
  {
    value: 'bike',
    label: 'Cargo bike',
    capacity: 'Up to 25 kg · 60 × 40 × 40 cm',
    fits: ['Documents', 'A food order', 'A small box'],
  },
  {
    value: 'car',
    label: 'Car',
    capacity: 'Up to 150 kg · 100 × 80 × 60 cm',
    fits: ['Two suitcases', 'Four boxes', 'A bicycle'],
  },
  {
    value: 'van',
    label: 'Van',
    capacity: 'Up to 800 kg · 240 × 150 × 140 cm',
    fits: ['A sofa', 'A studio move', 'Half a pallet'],
  },
  {
    value: 'boxTruck',
    label: 'Box truck',
    capacity: 'Up to 3,500 kg · 420 × 200 × 210 cm',
    fits: ['Two pallets', 'A two-bedroom move', 'A tail lift'],
  },
  {
    value: 'refrigerated',
    label: 'Refrigerated van',
    capacity: 'Up to 700 kg · held at 2–8 °C',
    fits: ['Fresh produce', 'Chilled catering', 'Flowers'],
  },
];

/** The picker's default copy. */
export const VEHICLE_PICKER_LABELS: Required<VehiclePickerLabels> = {
  from: 'From',
  fits: (label: string) => `What fits in a ${label}`,
  unavailable: 'Not available for this load',
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
