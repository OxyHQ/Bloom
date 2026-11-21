import {
  type RouteStop,
  RouteStops as BloomRouteStops,
  type RouteStopsProps,
} from '@oxy.so/bloom/route-stops';

import { Node, type ViewModifiers } from '../node';
import type { ControlDensity } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** An origin, a destination and the stops between them. */
export type RouteStopsKind = 'routeStops';

/**
 * Bloom `RouteStops`' data: its handlers (a press, a swap, an add, a remove),
 * `canAddStop`, its words and its add glyph. A stop's `badge` and `action` are
 * React elements (`toElement(view)`), as they are data.
 */
export type RouteStopsOptions = Omit<
  RouteStopsProps,
  'style' | 'testID' | 'accessibilityLabel' | 'stops' | 'density'
>;

/** Bloom `RouteStops`; `.label()` names the list. */
export interface RouteStopsView extends ViewModifiers<RouteStopsView> {
  /** `default` (comfortable) or `compact`. */
  density(value: ControlDensity): RouteStopsView;
}

export function RouteStops(
  stops: readonly RouteStop[],
  options: RouteStopsOptions = {},
): RouteStopsView {
  return new Node('routeStops', { stops, options }, []);
}

export const ROUTE_STOPS: Record<RouteStopsKind, ControlRenderer> = {
  routeStops: product(BloomRouteStops, { own: (d) => ({ density: rowDensity(d) }) }),
};
