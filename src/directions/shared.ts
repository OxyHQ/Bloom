/**
 * The pure parts of `directions`: the label a transit badge can be read with,
 * and the sentences the two components announce.
 */
import { readableOn } from '../styles/color-contrast';
import { hairlineOn, surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import {
  DIRECTIONS_MANEUVER_LABELS,
  DIRECTIONS_MODE_LABELS,
  DIRECTIONS_TRAFFIC_LABELS,
} from './constants';
import type {
  DirectionsMode,
  DirectionsRoute,
  DirectionsStep,
  DirectionsSummaryLabels,
  DirectionsTraffic,
  TransitLine,
} from './types';

export interface TransitLineColors {
  /** The operator's colour, as given. */
  background: string;
  /** Whichever end of the theme's reading pair MEASURES legible on it. */
  foreground: string;
}

/**
 * The badge's two colours for a line that carries its own.
 *
 * The label is not derived from the fill — it is CHOSEN from the theme's own
 * two reading colours by measuring contrast against the fill, which is what
 * `readableOn` does. That distinction matters: a derived label (lighten the
 * fill until it clears AA) invents a colour that is in no palette, and on a
 * saturated operator red it lands on pink.
 *
 * Both candidates are always offered in both modes, because the fill is the
 * operator's and has no idea which mode it landed in: a yellow line needs the
 * dark label on a dark page just as much as on a light one.
 */
export function resolveTransitLineColors(theme: Theme, color: string): TransitLineColors {
  return {
    background: color,
    foreground: readableOn(color, [theme.colors.background, theme.colors.text]),
  };
}

/** "Line L4, towards Pla del Bosc" — a badge showing two characters says nothing aloud. */
export function describeTransitLine(line: TransitLine): string {
  if (line.accessibilityLabel) return line.accessibilityLabel;
  return [`Line ${line.name}`, line.headsign].filter(Boolean).join(', ');
}

/** The traffic word as drawn. */
export function trafficLabelFor(
  traffic: DirectionsTraffic | undefined,
  override: string | undefined,
  labels: DirectionsSummaryLabels | undefined,
): string | null {
  if (traffic === undefined) return null;
  return override ?? labels?.traffic?.[traffic] ?? DIRECTIONS_TRAFFIC_LABELS[traffic];
}

/** The mode word as drawn. */
export function modeLabelFor(
  mode: DirectionsMode,
  labels: DirectionsSummaryLabels | undefined,
): string {
  return labels?.mode?.[mode] ?? DIRECTIONS_MODE_LABELS[mode];
}

/**
 * One route in a sentence — "24 min, 8.2 km, Arrives 18:42, Via Ronda del
 * Nord, Light traffic, Line L4".
 *
 * The row draws a duration, a `via` line, a chip and up to three badges, and a
 * reader moving by row hears one utterance per route or seven fragments per
 * route. This is the one.
 */
export function describeRoute(
  route: DirectionsRoute,
  labels: DirectionsSummaryLabels | undefined,
): string {
  const parts: string[] = [route.duration];
  if (route.distance) parts.push(route.distance);
  if (route.arrival) parts.push(route.arrival);
  if (route.via) parts.push(route.via);
  const traffic = trafficLabelFor(route.traffic, route.trafficLabel, labels);
  if (traffic) parts.push(traffic);
  if (route.note) parts.push(route.note);
  for (const line of route.lines ?? []) parts.push(describeTransitLine(line));
  return parts.join(', ');
}

/**
 * One step in a sentence, with the MANEUVER WORD first.
 *
 * The glyph is the only thing on the row that says which way to turn, and a
 * glyph says nothing aloud — the same hole `RouteStops` fills by naming the
 * marker's state. `currentWord` is added first when this is the step the
 * traveller is on, because a wash does not announce either.
 */
export function describeStep(
  step: DirectionsStep,
  options: { current?: boolean; currentWord?: string } = {},
): string {
  if (step.accessibilityLabel) {
    return options.current && options.currentWord
      ? `${options.currentWord}, ${step.accessibilityLabel}`
      : step.accessibilityLabel;
  }
  const maneuver = DIRECTIONS_MANEUVER_LABELS[step.maneuver ?? 'straight'];
  return [
    options.current ? options.currentWord : undefined,
    maneuver,
    step.instruction,
    step.detail,
    step.line ? describeTransitLine(step.line) : undefined,
    step.distance,
  ]
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(', ');
}

export interface DirectionsPaint extends SurfaceTextPaint {
  /** The hairline under a leg header and between blocks. */
  border: string;
  /** The tint a step wears while it is the one the traveller is on. */
  currentFill: string;
  /** The label on that tint. */
  currentText: string;
}

/**
 * Everything `directions` paints, read off the surface it was dropped on — a
 * sheet, a card or the page. The current step's wash is the accent's own
 * `subtle` pair, so it is legible by construction and moves with the preset.
 */
export function resolveDirectionsPaint(theme: Theme, surface: string): DirectionsPaint {
  const accent = resolveAccentColors(theme.colors, 'primary', 'subtle');
  return {
    ...surfaceTextOn(theme, surface),
    border: hairlineOn(theme, surface),
    currentFill: accent.background,
    currentText: accent.foreground,
  };
}
