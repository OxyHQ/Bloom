import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AddressDensity, AddressKind } from '../address';
import type { BloomIconComponent } from '../icons/icon-component';

/**
 * How far the journey has got. `reached` is behind, `current` is where the
 * thing is heading or standing now, `pending` is ahead — so the same component
 * draws a route being PLANNED (every stop pending) and one being TRAVELLED.
 */
export type RouteStopState = 'pending' | 'current' | 'reached';

export interface RouteStop {
  /** Identifies the stop to `onPressStop` / `onRemoveStop`, and keys the row. */
  id: string;
  /** The line the stop is recognised by — "Home", "Carrer de l’Om 14". */
  title: string;
  /** The rest of it. */
  subtitle?: string;
  /** Default `pending`. */
  state?: RouteStopState;
  /** A short trailing reading — "12 min", "1.2 km". */
  meta?: string;
  /** Passed to the row: chooses nothing here, because the marker column IS the glyph. */
  kind?: AddressKind;
  /** A node after the title — a `Badge`. */
  badge?: ReactNode;
  /** A trailing control, drawn before the remove affordance. */
  action?: ReactNode;
  /** The row's announced name, overriding the one assembled from its parts. */
  accessibilityLabel?: string;
}

/**
 * Every word `RouteStops` speaks, in one prop rather than seven — all of it is
 * copy an app localises, and none of it is layout.
 */
export interface RouteStopsLabels {
  /** The first stop's position. `"Origin"` in English. */
  origin?: string;
  /** The last stop's position, when there is more than one. `"Destination"` in English. */
  destination?: string;
  /** Every stop between them. `` (position) => `Stop ${position}` `` in English. */
  stop?: (position: number) => string;
  /** The swap control. `"Swap origin and destination"` in English. */
  swap?: string;
  /** The add control's label — it is a labelled button, so this is VISIBLE text. `"Add a stop"` in English. */
  addStop?: string;
  /** The remove control, per stop. ``(stop) => `Remove ${stop.title}` `` in English. */
  remove?: (stop: RouteStop) => string;
  /** In English: `reached` → "Reached", `current` → "Current stop", `pending` → "Not reached". */
  state?: Partial<Record<RouteStopState, string>>;
}

export interface RouteStopsProps {
  /** Origin first, destination last, everything else in between. */
  stops: readonly RouteStop[];
  /** Makes each row pressable — an app opens its own picker from here. */
  onPressStop?: (id: string) => void;
  /**
   * Draws the swap control. It is offered ONLY for exactly two stops: with
   * three or more there is no single swap to make, and a control that silently
   * meant something different at three stops is worse than no control.
   */
  onSwap?: () => void;
  /** Draws the "add a stop" button under the list. */
  onAddStop?: () => void;
  /** Draws a remove affordance on every stop. */
  onRemoveStop?: (id: string) => void;
  /** Disables `onAddStop`'s button — an app that caps the number of stops. */
  canAddStop?: boolean;
  /** Default `comfortable`. */
  density?: AddressDensity;
  labels?: RouteStopsLabels;
  /** The glyph on the add button. Default a plus. */
  addIcon?: BloomIconComponent;
  /** Names the list. `"Route stops"` in English. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
