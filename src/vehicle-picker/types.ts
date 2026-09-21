import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/**
 * The five vehicles a carrier marketplace routes a job to, smallest first.
 *
 * They are a LADDER of capacity, not a taxonomy: each one takes everything the
 * one before it takes and more, which is what makes "the smallest one that can
 * carry this" a question the caller can answer. `refrigerated` breaks the
 * ladder on purpose — it is a van that holds a temperature, so it is chosen for
 * what the load IS rather than for how big it is.
 */
export type VehicleKind = 'bike' | 'car' | 'van' | 'boxTruck' | 'refrigerated';

export interface VehicleOption<T extends string = VehicleKind> {
  /** Identifies the choice to `onValueChange`, and keys the row. */
  value: T;
  /** The vehicle's name — "Cargo bike", "Box truck". */
  label: string;
  /**
   * What it can take, in ONE line: "Up to 25 kg · 60 × 40 × 40 cm". Weights,
   * volumes and units are the app's — nothing here parses or converts a number.
   */
  capacity: string;
  /**
   * Short nouns for what actually fits — "Two suitcases", "A washing machine".
   * Drawn as chips under the capacity, and read after it.
   */
  fits?: readonly string[];
  /**
   * The cheapest this vehicle goes for, PRE-FORMATTED: `"€8.90"`. The picker
   * does no currency maths and never adds a number to another.
   */
  priceFrom?: string;
  /** The glyph. Defaults to the built-in one for a built-in `value`. */
  icon?: BloomIconComponent;
  /** Stops the option being chosen, and dims it. */
  disabled?: boolean;
  /**
   * WHY it cannot be chosen — "The load is 45 kg; this takes 25."
   *
   * A disabled option with no reason is a dead end: the row the user wants is
   * greyed out and the screen does not say what to change. The picker falls
   * back to `labels.unavailable` so nothing is silent, but the fallback says
   * only THAT it is unavailable, which is the half that was already visible.
   */
  unavailableReason?: string;
}

/** Every word the picker speaks, in one prop. All of it is copy an app localises. */
export interface VehiclePickerLabels {
  /** Before the `priceFrom` amount. Default `"From"`. */
  from?: string;
  /** Names the `fits` chip row, per option. Default `` (label) => `What fits in a ${label}` ``. */
  fits?: (label: string) => string;
  /** The reason fallback on a disabled option with none. Default `"Not available for this load"`. */
  unavailable?: string;
}

export interface VehiclePickerProps<T extends string = VehicleKind> {
  /** The chosen vehicle, or `null` while none is. Fully controlled. */
  value: T | null;
  /** Called with the chosen vehicle. Never called with the value already chosen. */
  onValueChange: (value: T) => void;
  /** The vehicles, in the order they should be read. Default {@link VEHICLE_OPTIONS}. */
  options?: readonly VehicleOption<T>[];
  /**
   * A heading over the list, drawn the way a search panel's pickers draw theirs
   * — `body-semibold` over a `body-2-regular` description. Without it the
   * caller owns the heading and the picker starts at its first option.
   */
  title?: string;
  description?: string;
  /** Dims and stops every option, whatever each one says. */
  disabled?: boolean;
  labels?: VehiclePickerLabels;
  /**
   * Names the group. Default `"Vehicle"` — and it matters even when `title` is
   * drawn, because a heading beside a group is a sibling, not a label.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Derives `-<value>` for each option. */
  testID?: string;
}
