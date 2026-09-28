import { parseRgba } from '../theme/color-utils';
import { surfaceFillVars, type SurfaceLevel } from '../styles/surface-levels';
import { resolveSurfaceFill, resolveSurfaceTint } from './shared';

export interface SurfaceMaterialInput {
  fill: string;
  parentFill: string;
  parentLevel?: SurfaceLevel;
  /** False for plain/backing hosts: publish their fill without material or a depth step. */
  paint?: boolean;
  /** Explicit depth origin for portals, rather than inheriting the triggering card. */
  level?: SurfaceLevel;
}

/** One decision for the pixels, descendant backing, depth and CSS aliases. */
export function resolveSurfaceMaterial({ fill, parentFill, parentLevel = 0, paint = true, level }: SurfaceMaterialInput) {
  const visible = fill.trim().toLowerCase() !== 'transparent' && parseRgba(fill)?.a !== 0;
  const painted = paint && visible;
  const paintFill = painted ? resolveSurfaceTint(fill) : fill;
  const publishedFill = resolveSurfaceFill(paintFill, parentFill);
  return {
    painted,
    paintFill,
    publishedFill,
    level: level ?? (painted ? Math.min(parentLevel + 1, 3) as SurfaceLevel : parentLevel),
    vars: surfaceFillVars(visible ? publishedFill : undefined),
  };
}
