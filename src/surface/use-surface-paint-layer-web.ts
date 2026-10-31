import { useRef, type RefObject } from 'react';
import { useBakedMaterial } from './baked-material';

/** Web paint needs a DOM node and a layout effect to maintain its baked material. */
export function useSurfacePaintLayer(
  enabled: boolean,
  paintFill: string | undefined,
  resolvedFill: string,
  optics: unknown,
  rim: boolean,
): RefObject<HTMLElement | null> | null {
  const ref = useRef<HTMLElement | null>(null);
  useBakedMaterial(ref, enabled, [paintFill, resolvedFill, optics, rim]);
  return ref;
}
