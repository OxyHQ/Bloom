import { useSurfaceLayer } from './use-surface-layer';
import { resolveSurfaceMaterial, type SurfaceMaterialInput } from './resolve-surface-material';

/** Passive surface defaults come from the actual nearest backing. */
export function useResolvedSurface(options: Partial<SurfaceMaterialInput> = {}) {
  const parent = useSurfaceLayer();
  return resolveSurfaceMaterial({ ...options, fill: options.fill ?? parent.fill, parentFill: options.parentFill ?? parent.parentFill, parentLevel: options.parentLevel ?? parent.parentLevel });
}
