import type { RefObject } from 'react';

/** Native paint has no DOM material host to observe. */
export function useSurfacePaintLayer(
  _enabled: boolean,
  _paintFill: string | undefined,
  _resolvedFill: string,
  _optics: unknown,
  _rim: boolean,
): RefObject<HTMLElement | null> | null {
  return null;
}
