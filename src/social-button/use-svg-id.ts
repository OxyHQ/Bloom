import { useId } from 'react';

/**
 * A DOM-safe id prefix, per component instance. Two marks of one brand on a
 * page must not resolve each other's `url(#…)`, and React's `useId` carries
 * characters an SVG id cannot.
 */
export function useSvgIdPrefix(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, '')}-`;
}
