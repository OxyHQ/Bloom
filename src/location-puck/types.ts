import type { StyleProp, ViewStyle } from 'react-native';

/**
 * How trustworthy the position under the puck is.
 *
 * `locating` is "we are still working it out" — the dot pulses and the halo
 * breathes, because a still puck over a wrong coordinate reads as a fix.
 * `located` is a live fix and stands still. `stale` is a position that is no
 * longer being updated: it goes quiet, loses the accent, and SAYS SO, because
 * a dimmer dot is not a sentence and a reader who cannot see it has no other
 * way of learning that the map is showing where you were.
 */
export type LocationPuckState = 'locating' | 'located' | 'stale';

/**
 * What the map underneath is doing, which is what decides where the cone
 * points and whether there is a cone at all.
 *
 * `following` — the map is north-up and the puck turns inside it.
 * `compass` — the map turns so the heading is always up, so the cone is drawn
 *   straight up and the app's own rotation does the rest. Passing the heading
 *   AND rotating the map would turn the cone twice.
 * `navigating` — the puck is a chevron on a route. The chevron IS the
 *   direction, so no cone is drawn beside it.
 */
export type LocationPuckMode = 'following' | 'compass' | 'navigating';

export interface LocationPuckProps {
  /** Default `located`. */
  state?: LocationPuckState;
  /** Default `following`. */
  mode?: LocationPuckMode;
  /**
   * Which way you are facing, in degrees clockwise from north. Turns the cone
   * in `following`, and the chevron in `navigating`; ignored in `compass`,
   * where the map itself is what turned.
   */
  heading?: number;
  /**
   * The platform's own ± uncertainty for {@link heading}, in DEGREES, and the
   * cone's half-width: the wedge is the uncertainty, drawn. Clamped into
   * `[coneMinHalfAngle, coneMaxHalfAngle]`, and defaulted to the minimum when
   * the platform reports nothing.
   */
  headingAccuracy?: number;
  /**
   * No heading at all — draws NO cone. A guessed cone is worse than none: it
   * is a confident claim about the one thing the device could not measure.
   */
  headingUnknown?: boolean;
  /**
   * The accuracy halo's radius in PIXELS. The app computes it from its own map
   * projection (metres at this latitude and zoom → pixels) and re-renders on
   * zoom, exactly as it does for `MapAreaCircle` — which is the circle this
   * draws.
   *
   * Without it no halo is drawn: a halo of an invented size is a claim about
   * precision nobody measured.
   */
  accuracyRadius?: number;
  /** How far the cone reaches, in pixels. Default {@link LOCATION_PUCK_GEOMETRY}`.cone`. */
  coneLength?: number;
  /**
   * The puck's announced name. Defaults to the sentence
   * {@link describeLocationPuck} builds from the state, the mode and the
   * heading — a coloured dot says nothing aloud.
   */
  accessibilityLabel?: string;
  /** Replaces the English state words. */
  stateLabels?: Partial<Record<LocationPuckState, string>>;
  /**
   * Force the pulse off regardless of the OS preference. Omitted, the puck
   * reads the platform's reduced-motion setting and stands still when it is on.
   */
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-halo`, `-cone`, `-dot`, `-chevron`. */
  testID?: string;
}
