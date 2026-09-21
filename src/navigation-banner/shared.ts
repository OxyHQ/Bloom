/**
 * What the guidance surfaces paint, and the sentences they announce. Pure, so
 * a gate can walk every preset x mode and every state without rendering.
 */
import { DIRECTIONS_MANEUVER_LABELS } from '../directions/constants';
import type { DirectionsManeuver } from '../directions/types';
import {
  hairlineOn,
  resolveSurfaceLevel,
  surfaceTextOn,
  type SurfaceTextPaint,
} from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { NAVIGATION_STATE_LABELS } from './constants';
import type {
  ArrivalBarLabels,
  LaneGuidanceLabels,
  NavigationBannerLabels,
  NavigationBannerState,
  NavigationLane,
} from './types';

export interface NavigationPaint extends SurfaceTextPaint {
  /** The island's own fill — what every rung here is measured against. */
  surface: string;
  /** The rule between the maneuver row and whatever sits under it. */
  border: string;
}

/**
 * Read off the island, not off the page.
 *
 * `GlassIsland` paints rung 1 of the surface ladder at the chrome alpha, so
 * rung 1 is the fill the banner's own text has to be legible on — and it is the
 * fill whether the map underneath is a night satellite tile or a pale street
 * map, which is the whole reason the guidance sits on an island instead of
 * directly on the tiles.
 */
export function resolveNavigationPaint(theme: Theme): NavigationPaint {
  const level = resolveSurfaceLevel(theme, 1);
  return {
    surface: level.background,
    border: hairlineOn(theme, level.background),
    ...surfaceTextOn(theme, level.background),
  };
}

/** The maneuver's word, as drawn or announced. */
export function maneuverWordFor(
  maneuver: DirectionsManeuver,
  labels: NavigationBannerLabels | undefined,
): string {
  return labels?.maneuver?.[maneuver] ?? DIRECTIONS_MANEUVER_LABELS[maneuver];
}

/**
 * The banner in one utterance — "In 400 m, turn right, Carrer del Roure, then
 * turn left".
 *
 * The DISTANCE comes first because that is the order a driver needs it in, and
 * the maneuver word is spelled out because the glyph is the only thing on
 * screen that says which way to turn and a glyph says nothing aloud — the same
 * hole `directions`' own `describeStep` fills, and the same fix.
 *
 * In the two exceptional states the state's own headline replaces the maneuver
 * entirely: a reader told to turn right while the car is off the route has been
 * told the one thing that is no longer true.
 */
export function describeNavigationBanner(options: {
  maneuver: DirectionsManeuver;
  distance?: string;
  instruction: string;
  then?: string;
  thenManeuver?: DirectionsManeuver;
  state?: NavigationBannerState;
  labels?: NavigationBannerLabels;
}): string {
  const { labels } = options;
  const state = options.state ?? 'guiding';
  if (state !== 'guiding') {
    const headline =
      (state === 'off-route' ? labels?.offRoute : labels?.rerouting) ??
      NAVIGATION_STATE_LABELS[state];
    return [headline, options.instruction].filter(Boolean).join(', ');
  }
  const thenWord = labels?.then ?? 'then';
  const thenPart =
    options.thenManeuver !== undefined || options.then
      ? [
          thenWord,
          options.thenManeuver !== undefined
            ? // Lowercased, because it lands MID-SENTENCE after "then" — the
              // maneuver table's words are written to start a sentence.
              maneuverWordFor(options.thenManeuver, labels).toLowerCase()
            : undefined,
          options.then,
        ]
          .filter(Boolean)
          .join(' ')
      : undefined;
  return [
    options.distance,
    maneuverWordFor(options.maneuver, labels),
    options.instruction,
    thenPart,
  ]
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(', ');
}

/**
 * The lanes in one utterance — "Lane guidance, 4 lanes, use lane 3 and lane 4".
 *
 * Lanes are numbered from the LEFT, one-based, because that is how a driver
 * counts them through the windscreen. A row with nothing allowed still
 * announces how many there are: "four lanes" is information, silence is not.
 */
export function describeLanes(
  lanes: readonly NavigationLane[],
  labels: LaneGuidanceLabels | undefined,
): string {
  const head = labels?.lanes ?? 'Lane guidance';
  const laneWord = labels?.lane ?? 'lane';
  const useWord = labels?.use ?? 'use';
  const count = `${lanes.length} ${lanes.length === 1 ? laneWord : `${laneWord}s`}`;
  const allowed = lanes
    .map((lane, index) => (lane.allowed ? `${laneWord} ${index + 1}` : null))
    .filter((part): part is string => part !== null);
  if (allowed.length === 0) return `${head}, ${count}`;
  return `${head}, ${count}, ${useWord} ${allowed.join(' and ')}`;
}

/** "Speed limit 50 km/h, over the limit". */
export function describeSpeedLimit(options: {
  limit: string | number;
  unit?: string;
  exceeded?: boolean;
  exceededLabel?: string;
}): string {
  const base = ['Speed limit', String(options.limit), options.unit].filter(Boolean).join(' ');
  if (!options.exceeded) return base;
  return `${base}, ${options.exceededLabel ?? 'over the limit'}`;
}

/** "Arrival 18:42, Left 24 min, Distance 8.2 km" — three readings, one utterance. */
export function describeArrival(options: {
  arrival: string;
  remainingTime: string;
  remainingDistance: string;
  labels?: ArrivalBarLabels;
}): string {
  const { labels } = options;
  return [
    `${labels?.arrival ?? 'Arrival'} ${options.arrival}`,
    `${labels?.time ?? 'Left'} ${options.remainingTime}`,
    `${labels?.distance ?? 'Distance'} ${options.remainingDistance}`,
  ].join(', ');
}
