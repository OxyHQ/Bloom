import { Platform } from 'react-native';
import { surfaceBodyBounds, solidBacking } from './body-backing';
import type { ColorBounds } from './filter-color';
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
  /** Opt-in body model; unknown sampler unless the caller proves all sampled pixels. */
  webOptics?: {
    mode: 'light' | 'dark';
    reducedTransparency?: boolean;
    sampler?: ColorBounds;
    /** Minimum distance of the text region from every painted edge, in CSS px. */
    interiorInset?: number;
  };
}

/** One decision for the pixels, descendant backing, depth and CSS aliases. */
export function resolveSurfaceMaterial({
  fill,
  parentFill,
  parentLevel = 0,
  paint = true,
  level,
  webOptics,
}: SurfaceMaterialInput) {
  const visible = fill.trim().toLowerCase() !== 'transparent' && parseRgba(fill)?.a !== 0;
  const painted = paint && visible;
  const paintFill = painted ? resolveSurfaceTint(fill) : fill;
  const publishedFill = resolveSurfaceFill(paintFill, parentFill);
  const bodyBounds =
    painted && Platform.OS === 'web' && webOptics
      ? webOptics.reducedTransparency
        ? solidBacking(publishedFill)
        : surfaceBodyBounds(paintFill, webOptics.mode, webOptics.sampler, webOptics.interiorInset)
      : undefined;
  return {
    bodyBounds,
    painted,
    paintFill,
    publishedFill,
    /** The opaque body with transparency reduced: the published fill, or nothing unpainted. */
    solidFill: painted ? publishedFill : 'transparent',
    level: level ?? (painted ? (Math.min(parentLevel + 1, 3) as SurfaceLevel) : parentLevel),
    vars: surfaceFillVars(visible ? publishedFill : undefined),
  };
}
