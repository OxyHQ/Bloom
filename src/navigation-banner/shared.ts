/**
 * What the guidance surfaces paint, and the sentences they announce. Pure, so
 * a gate can walk every preset x mode and every state without rendering.
 */
import { DIRECTIONS_MESSAGES, type DirectionsMessages } from '../directions/messages';
import type { DirectionsManeuver } from '../directions/types';
import {
  hairlineOn,
  resolveSurfaceLevel,
  surfaceTextOn,
  type SurfaceTextPaint,
} from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import { NAVIGATION_BANNER_MESSAGES, type NavigationBannerMessages } from './messages';
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

/** The maneuver's word, as drawn or announced — in `directions`' language, English when omitted. */
export function maneuverWordFor(
  maneuver: DirectionsManeuver,
  labels: NavigationBannerLabels | undefined,
  directions: DirectionsMessages = DIRECTIONS_MESSAGES.en,
): string {
  return labels?.maneuver?.[maneuver] ?? directions.maneuvers[maneuver];
}

/** The exceptional state's headline: the caller's word, else the language's. */
export function stateHeadlineFor(
  state: Exclude<NavigationBannerState, 'guiding'>,
  labels: NavigationBannerLabels | undefined,
  messages: NavigationBannerMessages = NAVIGATION_BANNER_MESSAGES.en,
): string {
  return (state === 'off-route' ? labels?.offRoute : labels?.rerouting) ?? messages.states[state];
}

/**
 * The line after the maneuver — "then turn left Carrer del Roure". The
 * language places its own "then" and cases the maneuver word (written to start
 * a sentence) for the middle of one; a caller's `labels.then` keeps the
 * word-joined English shape it always had.
 */
export function thenLineFor(options: {
  thenManeuver?: DirectionsManeuver;
  then?: string;
  labels?: NavigationBannerLabels;
  messages?: NavigationBannerMessages;
  directions?: DirectionsMessages;
}): string | undefined {
  const { labels } = options;
  if (options.thenManeuver === undefined && !options.then) return undefined;
  const word =
    options.thenManeuver !== undefined
      ? maneuverWordFor(options.thenManeuver, labels, options.directions)
      : undefined;
  if (labels?.then !== undefined) {
    return [labels.then, word?.toLowerCase(), options.then].filter(Boolean).join(' ');
  }
  return (options.messages ?? NAVIGATION_BANNER_MESSAGES.en).thenLine(options.then, word);
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
  /** The language's words; English when omitted. */
  messages?: NavigationBannerMessages;
  directions?: DirectionsMessages;
}): string {
  const { labels, messages, directions } = options;
  const state = options.state ?? 'guiding';
  if (state !== 'guiding') {
    const headline = stateHeadlineFor(state, labels, messages);
    return [headline, options.instruction].filter(Boolean).join(', ');
  }
  const thenPart = thenLineFor({
    thenManeuver: options.thenManeuver,
    then: options.then,
    labels,
    messages,
    directions,
  });
  return [
    options.distance,
    maneuverWordFor(options.maneuver, labels, directions),
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
  messages: NavigationBannerMessages = NAVIGATION_BANNER_MESSAGES.en,
): string {
  const head = labels?.lanes ?? messages.laneGuidance;
  // A caller's own `lane`/`use` words keep the English-shaped sentence they
  // were written for; otherwise the language builds each piece whole.
  const laneWord = labels?.lane;
  const count =
    laneWord !== undefined
      ? `${lanes.length} ${lanes.length === 1 ? laneWord : `${laneWord}s`}`
      : messages.laneCount(lanes.length);
  const allowed = lanes
    .map((lane, index) =>
      lane.allowed
        ? laneWord !== undefined
          ? `${laneWord} ${index + 1}`
          : messages.laneNumber(index + 1)
        : null,
    )
    .filter((part): part is string => part !== null);
  if (allowed.length === 0) return `${head}, ${count}`;
  const list = allowed.reduce((joined, part) => messages.and(joined, part));
  const use = labels?.use !== undefined ? `${labels.use} ${list}` : messages.useLanes(list);
  return `${head}, ${count}, ${use}`;
}

/** "Speed limit 50 km/h, over the limit". */
export function describeSpeedLimit(options: {
  limit: string | number;
  unit?: string;
  exceeded?: boolean;
  exceededLabel?: string;
  /** The language's words; English when omitted. */
  messages?: NavigationBannerMessages;
}): string {
  const messages = options.messages ?? NAVIGATION_BANNER_MESSAGES.en;
  const base = messages.speedLimit([String(options.limit), options.unit].filter(Boolean).join(' '));
  if (!options.exceeded) return base;
  return `${base}, ${options.exceededLabel ?? messages.overLimit}`;
}

/** "Arrival 18:42, Left 24 min, Distance 8.2 km" — three readings, one utterance. */
export function describeArrival(options: {
  arrival: string;
  remainingTime: string;
  remainingDistance: string;
  labels?: ArrivalBarLabels;
  /** The language's words; English when omitted. */
  messages?: NavigationBannerMessages;
}): string {
  const { labels } = options;
  const messages = options.messages ?? NAVIGATION_BANNER_MESSAGES.en;
  return [
    `${labels?.arrival ?? messages.arrival} ${options.arrival}`,
    `${labels?.time ?? messages.left} ${options.remainingTime}`,
    `${labels?.distance ?? messages.distance} ${options.remainingDistance}`,
  ].join(', ');
}
