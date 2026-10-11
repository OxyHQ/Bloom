import type { SurfaceShape } from '../shapes/corner-types';
import { RADIUS } from './scales';

/** Component policies. Geometry and renderers never import these tokens. */
export const SURFACE_SHAPES = {
  card: { radius: RADIUS['radius-20'], curve: 'round' },
  sidebar: { radius: RADIUS['radius-28'], curve: 'round' },
  panel: { radius: RADIUS['radius-20'], curve: 'round' },
  menu: { radius: RADIUS['radius-16'], curve: 'round' },
  sheet: { radius: { topStart: RADIUS['radius-24'], topEnd: RADIUS['radius-24'] }, curve: 'round' },
  chart: { curve: 'smooth' },
  capsule: { curve: 'round' },
  glass: { curve: 'smooth' },
} as const satisfies Record<string, SurfaceShape>;
