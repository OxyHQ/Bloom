import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { VehicleKind } from './types';

/** One built-in vehicle's words. */
export interface VehicleWords {
  label: string;
  capacity: string;
  fits: [string, string, string];
}

/**
 * Every fixed string the vehicle picker draws or announces — its own words and
 * the five built-in vehicles' — in each Bloom language. A caller's `labels`,
 * `accessibilityLabel` and `options` still win.
 */
export interface VehiclePickerMessages {
  /** Before the `priceFrom` amount. */
  from: string;
  /** Names an option's `fits` chip row. */
  fits: (label: string) => string;
  /** The reason fallback on a disabled option with none. */
  unavailable: string;
  /** Names the group. */
  vehicle: string;
  vehicles: Record<VehicleKind, VehicleWords>;
}

export const VEHICLE_PICKER_MESSAGES: MessageCatalog<VehiclePickerMessages> = defineMessages<VehiclePickerMessages>('VEHICLE_PICKER_MESSAGES', {
  from: 'From',
  fits: (label) => `What fits in a ${label}`,
  unavailable: 'Not available for this load',
  vehicle: 'Vehicle',
  vehicles: {
    bike: { label: 'Cargo bike', capacity: 'Up to 25 kg · 60 × 40 × 40 cm', fits: ['Documents', 'A food order', 'A small box'] },
    car: { label: 'Car', capacity: 'Up to 150 kg · 100 × 80 × 60 cm', fits: ['Two suitcases', 'Four boxes', 'A bicycle'] },
    van: { label: 'Van', capacity: 'Up to 800 kg · 240 × 150 × 140 cm', fits: ['A sofa', 'A studio move', 'Half a pallet'] },
    boxTruck: { label: 'Box truck', capacity: 'Up to 3,500 kg · 420 × 200 × 210 cm', fits: ['Two pallets', 'A two-bedroom move', 'A tail lift'] },
    refrigerated: { label: 'Refrigerated van', capacity: 'Up to 700 kg · held at 2–8 °C', fits: ['Fresh produce', 'Chilled catering', 'Flowers'] },
  },
});
