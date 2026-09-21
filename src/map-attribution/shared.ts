/**
 * What the small print paints, and how it reads aloud. Pure, so a gate can walk
 * every preset x mode without rendering.
 */
import {
  hairlineOn,
  resolveSurfaceLevel,
  surfaceTextOn,
  type SurfaceTextPaint,
} from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import type { MapScale } from './types';

export interface MapAttributionPaint extends SurfaceTextPaint {
  /** The island's own fill — what every rung here is measured against. */
  surface: string;
  /** The scale bar's rule and its end ticks. */
  rule: string;
  /** A separator between two readings. */
  border: string;
}

/**
 * Measured against the ISLAND's fill, not against the page and not against the
 * map.
 *
 * The map is content Bloom does not own — it can be a night satellite tile, a
 * white street map or a photograph — so no text rung can be floored against it.
 * The island's rung 1 fill is a surface Bloom DOES own, which is the whole
 * reason the small print sits on one: over a photo the credit stays legible
 * because it is not on the photo.
 *
 * The rule takes the GRAPHICAL rung (3:1) rather than a text one: a scale bar
 * is a line, and flooring it at text contrast would make the quietest thing on
 * the map the loudest thing on the strip.
 */
export function resolveMapAttributionPaint(theme: Theme): MapAttributionPaint {
  const level = resolveSurfaceLevel(theme, 1);
  const text = surfaceTextOn(theme, level.background);
  return {
    surface: level.background,
    rule: text.textGraphical,
    border: hairlineOn(theme, level.background),
    ...text,
  };
}

/**
 * "Scale, 500 m, 1000 ft".
 *
 * A bar and two ticks say nothing aloud, and the reading beside them is a
 * number with no noun — "500 m" on its own is as likely to be a distance to
 * somewhere as a scale. The word comes first so it is the first thing heard.
 */
export function describeScale(scales: readonly MapScale[], scaleLabel: string = 'Scale'): string {
  const readings = scales.map((scale) => scale.label).filter(Boolean);
  if (readings.length === 0) return scaleLabel;
  return `${scaleLabel}, ${readings.join(', ')}`;
}
