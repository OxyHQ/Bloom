/**
 * The puck's colours, its geometry maths, and the sentence it announces — all
 * pure, so a gate can walk every preset x mode and every heading without
 * rendering anything.
 */
import { resolveMapMarkerPaint } from '../map-marker/shared';
import { surfaceTextOn } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { LOCATION_PUCK_GEOMETRY, LOCATION_PUCK_STATE_LABELS } from './constants';
import type { LocationPuckMode, LocationPuckState } from './types';

export interface LocationPuckPaint {
  /** The live dot — the accent's own solid fill. */
  dot: string;
  /** The ring around it: the accent fill's OWN on-colour. */
  ring: string;
  /** The dot once the fix is stale: the accent gone, a quiet neutral in its place. */
  staleDot: string;
  /** The ring around THAT: the map-chrome surface the quiet neutral was floored against. */
  staleRing: string;
  /** The heading cone and the accuracy halo. */
  cone: string;
}

/**
 * ── THE RING IS THE DOT'S OWN ON-COLOUR, AND THAT IS WHY THERE ARE TWO ──────
 *
 * A ring around a dot has one job: make the dot read as a deliberate object
 * over tiles Bloom cannot see. Bloom cannot measure anything against those
 * tiles, but it CAN guarantee the ring reads against the dot — and every fill
 * in this library already ships with the colour that reads on it. So the live
 * ring is `resolveAccentColors(…, 'solid').foreground` (white for most seeds,
 * black for a light one like yellow or peach — the pair adapts, which a
 * hardcoded white ring does not), and the stale ring is the map-chrome surface,
 * because the stale dot is a text rung floored against exactly that surface.
 *
 * Measured over a dark tile: the chrome surface as the LIVE ring disappeared
 * entirely in dark mode — a dark ring on a dark map — while the on-colour
 * keeps the puck ringed in both modes over both tiles.
 *
 * Nothing here is derived. The cone and the halo are `map-marker`'s own
 * resolved `area` colour, so the puck belongs to the family that already draws
 * on maps; the dot and its ring are one accent pair; the stale dot and its ring
 * are one surface pair.
 */
export function resolveLocationPuckPaint(theme: Theme): LocationPuckPaint {
  const map = resolveMapMarkerPaint(theme);
  const accent = resolveAccentColors(theme.colors, 'primary', 'solid');
  return {
    dot: accent.background,
    ring: accent.foreground,
    staleDot: surfaceTextOn(theme, map.surface).textSecondary,
    staleRing: map.surface,
    cone: map.area,
  };
}

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

/**
 * The cone's half-width in degrees: the platform's own heading uncertainty,
 * clamped into the band where a wedge still means something.
 *
 * A non-finite or negative reading takes the floor rather than collapsing the
 * wedge to nothing — "the device told us nothing" is {@link
 * LocationPuckProps.headingUnknown}, and it draws no cone at all.
 */
export function coneHalfAngle(headingAccuracy: number | undefined): number {
  const { coneMinHalfAngle, coneMaxHalfAngle } = LOCATION_PUCK_GEOMETRY;
  if (headingAccuracy === undefined || !Number.isFinite(headingAccuracy)) return coneMinHalfAngle;
  return Math.min(coneMaxHalfAngle, Math.max(coneMinHalfAngle, headingAccuracy));
}

/** A heading folded into `[0, 360)`; a non-finite one reads as north. */
export function normalizeHeading(heading: number | undefined): number {
  if (heading === undefined || !Number.isFinite(heading)) return 0;
  return ((heading % 360) + 360) % 360;
}

/**
 * How far the puck's own box has to turn.
 *
 * `compass` is 0 BY CONSTRUCTION: the app has already rotated the map so the
 * heading is up, and turning the cone as well would apply the rotation twice —
 * the mirror of the correction `MapCompass` makes for its needle.
 */
export function puckRotation(mode: LocationPuckMode, heading: number | undefined): number {
  return mode === 'compass' ? 0 : normalizeHeading(heading);
}

/**
 * The wedge, as an SVG path, in a `2 * length` square whose centre is the dot.
 *
 * Drawn pointing UP (the `-90°` ray) and turned by the caller's own transform,
 * so the apex is the box's centre and a rotation about that centre is a
 * rotation about the dot. `MeterRing` makes the same split for the same reason:
 * `react-native-svg` applies an element transform before the geometry on some
 * native versions, so the rotation belongs on the host view, never on the path.
 *
 * `A` takes `large-arc-flag 0` because the arc is at most
 * `2 * coneMaxHalfAngle` = 110°, and `sweep-flag 1` because SVG's y axis points
 * down, so increasing angle is clockwise.
 */
export function conePath(length: number, halfAngle: number): string {
  const r = Math.max(0, length);
  const half = Math.max(0, Math.min(90, halfAngle));
  const centre = r;
  const start = ((-90 - half) * Math.PI) / 180;
  const end = ((-90 + half) * Math.PI) / 180;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const x1 = round(centre + r * Math.cos(start));
  const y1 = round(centre + r * Math.sin(start));
  const x2 = round(centre + r * Math.cos(end));
  const y2 = round(centre + r * Math.sin(end));
  return `M ${centre} ${centre} L ${x1} ${y1} A ${round(r)} ${round(r)} 0 0 1 ${x2} ${y2} Z`;
}

/**
 * The navigating chevron, as SVG polygon points in a `size` square, tip up.
 *
 * A chevron rather than an arrow because the notch is what makes the shape read
 * as a direction at 28px with no stroke weight to spare, and the notch depth is
 * 0.7 of the height — shallower and it is a triangle, deeper and the two wings
 * separate.
 */
export function chevronPoints(size: number): string {
  const s = Math.max(0, size);
  const half = s / 2;
  return `${half},0 ${s},${s} ${half},${s * 0.7} 0,${s}`;
}

/**
 * The square the whole puck occupies: whichever layer reaches furthest.
 *
 * Every layer is centred in it, so an app centres this ONE box on the
 * coordinate and the dot lands on the coordinate — the positioning contract
 * `map-marker` already publishes ("it positions nothing; centre it on the
 * point"). The halo is a diameter, the cone reaches `length` from the centre in
 * one direction but needs the full box to rotate inside.
 */
export function puckBoxSize(options: {
  accuracyRadius?: number;
  coneLength?: number;
  cone: boolean;
}): number {
  const { dot, ring } = LOCATION_PUCK_GEOMETRY;
  const puck = dot + ring * 2;
  const halo = options.accuracyRadius !== undefined && Number.isFinite(options.accuracyRadius)
    ? Math.max(0, options.accuracyRadius) * 2
    : 0;
  const cone = options.cone
    ? Math.max(0, options.coneLength ?? LOCATION_PUCK_GEOMETRY.cone) * 2
    : 0;
  return Math.max(puck, halo, cone);
}

// ---------------------------------------------------------------------------
//  The announcement
// ---------------------------------------------------------------------------

/**
 * What a screen reader hears instead of a coloured dot.
 *
 * The STATE comes first, because it is the part that is not recoverable by
 * looking: "your last known location" is the whole difference between a map
 * that is following you and one that stopped. The heading is added only when
 * there is one — a bearing the device did not measure must not be spoken any
 * more than it may be drawn.
 */
export function describeLocationPuck(options: {
  state: LocationPuckState;
  mode: LocationPuckMode;
  heading?: number;
  headingUnknown?: boolean;
  labels?: Partial<Record<LocationPuckState, string>>;
}): string {
  const word = options.labels?.[options.state] ?? LOCATION_PUCK_STATE_LABELS[options.state];
  const drawsHeading =
    !options.headingUnknown && options.heading !== undefined && Number.isFinite(options.heading);
  if (!drawsHeading) return word;
  return `${word}, facing ${Math.round(normalizeHeading(options.heading))} degrees`;
}
