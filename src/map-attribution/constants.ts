import { borderRadius } from '../styles/tokens';

export interface MapAttributionGeometry {
  /** The island's radius. The small print is a surface, so it takes a rung of the scale. */
  radius: number;
  /** The island's padding. */
  paddingVertical: number;
  /** The island's padding, sideways — wider, so short words are not pinched. */
  paddingHorizontal: number;
  /** Between the scale, the credit and the date. */
  gap: number;
  /** The scale bar's rule. */
  rule: number;
  /** The tick at each end of a bar, measured from the rule. */
  tick: number;
  /** Between the bar and its reading. */
  scaleGap: number;
  /** Between two stacked bars. */
  scaleStack: number;
}

/**
 * 6 and 10 of padding, and a radius of 8: the strip has to be the smallest
 * thing on the map and still be a surface rather than a shadow of one.
 *
 * The tick is 5 either side of the rule — long enough that the bar's ENDS are
 * what you read (a scale bar is a measurement between two marks, not a line),
 * short enough that it does not become a bracket.
 */
export const MAP_ATTRIBUTION_GEOMETRY: MapAttributionGeometry = {
  radius: borderRadius.sm,
  paddingVertical: 6,
  paddingHorizontal: 10,
  gap: 8,
  rule: 1,
  tick: 5,
  scaleGap: 6,
  scaleStack: 3,
};
