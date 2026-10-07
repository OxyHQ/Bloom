import type { SurfaceShape } from '../shapes/corner-types';
import { RADIUS } from './scales';

/** Component policies. Geometry and renderers never import these tokens. */
export const SURFACE_SHAPES = {
  card: { radius: RADIUS['radius-12'], curve: 'smooth' },
  sidebar: { radius: RADIUS['radius-28'], curve: 'round' },
  panel: { radius: RADIUS['radius-20'], curve: 'smooth' },
  menu: { radius: RADIUS['radius-16'], curve: 'smooth' },
  sheet: { radius: { topStart: RADIUS['radius-24'], topEnd: RADIUS['radius-24'] }, curve: 'smooth' },
  chart: { curve: 'smooth' },
  capsule: { curve: 'round' },
  glass: { curve: 'smooth' },
} as const satisfies Record<string, SurfaceShape>;
