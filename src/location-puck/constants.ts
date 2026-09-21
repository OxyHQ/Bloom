import type { LocationPuckState } from './types';

export interface LocationPuckGeometry {
  /** The dot's own diameter, inside the ring. */
  dot: number;
  /** The ring around it — the only thing that separates the dot from a tile of the same hue. */
  ring: number;
  /** The navigating chevron's box, tip to base. */
  chevron: number;
  /** How far the heading cone reaches by default, in pixels. */
  cone: number;
  /** The narrowest the cone gets, in degrees either side of the heading. */
  coneMinHalfAngle: number;
  /** The widest. Past this the wedge stops meaning "roughly this way" and starts meaning "somewhere". */
  coneMaxHalfAngle: number;
}

/**
 * 18 + 3 is a 24 puck, which is the smallest thing on a map that still reads as
 * a deliberate object rather than as a tile artefact, and it is deliberately
 * SMALLER than `map-marker`'s 36 cluster bubble: the puck is where you are, not
 * a thing you press, and it must not out-shout the markers you came to read.
 *
 * The cone reaches 72 — three puck diameters — because a wedge shorter than the
 * thing it comes out of reads as a collar rather than as a direction.
 */
export const LOCATION_PUCK_GEOMETRY: LocationPuckGeometry = {
  dot: 18,
  ring: 3,
  chevron: 34,
  cone: 72,
  coneMinHalfAngle: 14,
  coneMaxHalfAngle: 55,
};

/**
 * The cone's two gradient stops, as an OFFSET and an OPACITY — never as a
 * colour carrying alpha.
 *
 * Same shape, and the same reason, as `theme/glass-colors`' `GLASS_SHEEN`:
 * `react-native-svg` reads `stopColor` for its RGB and DISCARDS any alpha
 * channel in it, so an `rgba(…, 0.45)` stop paints at FULL strength on native
 * while web renders it correctly. A cone written that way is a hard-edged
 * accent wedge sitting over half the map on a device, and a gate that pins both
 * platforms to the same token stays green, because the two forks agree about
 * every value and only the renderer's reading of it differs.
 *
 * Holding the opacity in its own field removes the representation that can be
 * half-read: `HeadingCone` hands `color` to `stopColor` and `opacity` to
 * `stopOpacity`, which are the two props SVG actually defines.
 */
export const LOCATION_PUCK_CONE_STOPS = {
  /** At the apex, on the dot. */
  inner: { offset: 0, opacity: 0.45 },
  /** At the far end, gone. */
  outer: { offset: 1, opacity: 0 },
} as const;

/** How far the halo fades once the fix stops being refreshed. */
export const LOCATION_PUCK_STALE_OPACITY = 0.5;

/** One full breath of the `locating` pulse. */
export const LOCATION_PUCK_PULSE_MS = 1600;

/** The English default state words, in the order a sentence wants them. */
export const LOCATION_PUCK_STATE_LABELS: Readonly<Record<LocationPuckState, string>> = {
  locating: 'Finding your location',
  located: 'Your location',
  stale: 'Your last known location',
};
