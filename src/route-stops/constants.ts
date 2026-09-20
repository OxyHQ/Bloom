import type { AddressDensity } from '../address';
import type { RouteStopState } from './types';

export const ROUTE_STOP_STATE_LABELS: Record<RouteStopState, string> = {
  reached: 'Reached',
  current: 'Current stop',
  pending: 'Not reached',
};

export interface RouteStopsGeometry {
  /** The marker column's width. */
  column: number;
  /** The origin's ring and the destination's square. */
  terminal: number;
  /** A stop between them. */
  waypoint: number;
  /** How much wider the CURRENT stop's marker is, for its halo. */
  halo: number;
  /** The connector's thickness. */
  line: number;
  /** The destination square's corner. */
  square: number;
}

export const ROUTE_STOPS_GEOMETRY: Record<AddressDensity, RouteStopsGeometry> = {
  comfortable: { column: 24, terminal: 12, waypoint: 8, halo: 6, line: 2, square: 3 },
  compact: { column: 20, terminal: 10, waypoint: 6, halo: 4, line: 2, square: 2 },
};

/** The swap control's column, wide enough for a 44 target. */
export const ROUTE_STOPS_SWAP_COLUMN = 44;
export const ROUTE_STOPS_SWAP_SIZE = 40;
