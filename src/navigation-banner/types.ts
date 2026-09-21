import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { DirectionsManeuver } from '../directions/types';
import type { AccentTone } from '../theme/accent-colors';

/**
 * Where the guidance is.
 *
 * `guiding` is the ordinary case — the next maneuver, and how far to it.
 * `off-route` is the driver having left the line; the banner says SO rather
 * than continuing to point at a turn that is now behind them. `rerouting` is
 * the moment after, while a new line is being found: still not a maneuver, and
 * still not silence.
 *
 * The two exceptional states are not a different component because they occupy
 * the same strip, at the same moment, in the same place on the screen — a
 * second surface appearing where the first was is a jump, and the reader has to
 * re-find the thing they were reading.
 */
export type NavigationBannerState = 'guiding' | 'off-route' | 'rerouting';

/** Every word `NavigationBanner` speaks, in one prop. */
export interface NavigationBannerLabels {
  /** The headline in the `off-route` state. Default `"Off route"`. */
  offRoute?: string;
  /** The headline in the `rerouting` state. Default `"Finding a new route"`. */
  rerouting?: string;
  /** Precedes the following maneuver. Default `"then"`. */
  then?: string;
  /** Replaces the English maneuver words used in the announcement. */
  maneuver?: Partial<Record<DirectionsManeuver, string>>;
}

export interface NavigationBannerProps {
  /**
   * What to do next. The SAME vocabulary `directions` uses, and the same glyph
   * map (`DIRECTIONS_MANEUVER_ICON`) — a banner drawing a second set of arrows
   * from the step list beside it is two answers to one question.
   */
  maneuver: DirectionsManeuver;
  /**
   * How far to it, pre-formatted and short ("400 m", "1.2 km"). Drawn as the
   * FIGURE, in tabular numerals so a counting-down reading does not jitter the
   * street name under it.
   */
  distance?: string;
  /** What to do it onto — "Carrer del Roure". The line a driver reads. */
  instruction: string;
  /** The maneuver after this one; without it no second line is drawn. */
  thenManeuver?: DirectionsManeuver;
  /** The words beside it — "Carrer de l'Om". Defaults to the maneuver's own word. */
  then?: string;
  /** Default `guiding`. */
  state?: NavigationBannerState;
  /**
   * Anything that belongs UNDER the maneuver row inside the same pane — a
   * `LaneGuidance`, a `SpeedLimitPill`. Separated by a hairline; nothing is
   * drawn when it is empty.
   */
  children?: ReactNode;
  labels?: NavigationBannerLabels;
  /**
   * The banner's announced name. Defaults to the sentence
   * {@link describeNavigationBanner} builds — the glyph says the maneuver on
   * screen and says nothing aloud.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-glyph`, `-distance`, `-instruction`, `-then`, `-extras`. */
  testID?: string;
}

/**
 * The arrows one lane offers. A subset of the maneuver vocabulary rather than a
 * second one: a lane arrow IS a maneuver drawn small, and the four members that
 * make no sense painted on tarmac (`depart`, `arrive`, `board`, …) are the ones
 * left out.
 */
export type LaneDirection = Extract<
  DirectionsManeuver,
  | 'straight'
  | 'slight-left'
  | 'left'
  | 'sharp-left'
  | 'slight-right'
  | 'right'
  | 'sharp-right'
  | 'uturn'
>;

/** One lane across the carriageway, left to right as the driver sees them. */
export interface NavigationLane {
  /** Stable key. Defaults to the index. */
  id?: string;
  /** Every arrow painted in this lane, in the order they are painted. */
  directions: readonly LaneDirection[];
  /** Whether this lane takes you where you are going. Default `false`. */
  allowed?: boolean;
  /**
   * Which of {@link directions} to take from an allowed lane, drawn at full
   * strength while the rest of that lane's arrows stay quiet. Ignored on a lane
   * that is not allowed — every arrow in it is quiet.
   */
  preferred?: LaneDirection;
}

export interface LaneGuidanceLabels {
  /** Names the row. Default `"Lane guidance"`. */
  lanes?: string;
  /** The word before a lane number in the announcement. Default `"lane"`. */
  lane?: string;
  /** Precedes the allowed lanes. Default `"use"`. */
  use?: string;
}

export interface LaneGuidanceProps {
  lanes: readonly NavigationLane[];
  labels?: LaneGuidanceLabels;
  /** Defaults to the sentence {@link describeLanes} builds. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-lane-<n>`. */
  testID?: string;
}

export interface SpeedLimitPillProps {
  /** The number as drawn, pre-formatted ("50", "120"). Never converted here. */
  limit: string | number;
  /** Drawn under the sign ("km/h", "mph"). Announced with the figure. */
  unit?: string;
  /**
   * Whether the vehicle is over it. The sign fills with its tone instead of
   * ringing it — a sign that only got brighter is a sign a driver reads as the
   * same sign.
   */
  exceeded?: boolean;
  /** The ring's tone. Default `error`. */
  tone?: AccentTone;
  /** Defaults to `"Speed limit <limit> <unit>"`, plus the over-the-limit word. */
  accessibilityLabel?: string;
  /** Replaces the English over-the-limit word. Default `"over the limit"`. */
  exceededLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-sign`, `-unit`. */
  testID?: string;
}

/** Every word `ArrivalBar` speaks. */
export interface ArrivalBarLabels {
  /** Over the arrival time. Default `"Arrival"`. */
  arrival?: string;
  /** Over the remaining time. Default `"Left"`. */
  time?: string;
  /** Over the remaining distance. Default `"Distance"`. */
  distance?: string;
  /** The ending action. Default `"End"`. */
  end?: string;
}

export interface ArrivalBarProps {
  /** When you get there, pre-formatted ("18:42"). */
  arrival: string;
  /** How long is left ("24 min"). */
  remainingTime: string;
  /** How far is left ("8.2 km"). */
  remainingDistance: string;
  /** Draws the ending action. Without it (and without `action`) none is drawn. */
  onEnd?: () => void;
  /** An arbitrary trailing control, replacing the ending action. */
  action?: ReactNode;
  labels?: ArrivalBarLabels;
  /** Names the strip. Defaults to the three readings in a sentence. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-arrival`, `-time`, `-distance`, `-end`. */
  testID?: string;
}
