import { useId } from 'react';

/**
 * A DOM-safe id prefix, per component instance.
 *
 * Two SVGs of one shape on a page must not resolve each other's `url(#…)`, and
 * React's `useId` carries characters an SVG id cannot (`:r0:`). Stripping them
 * keeps the id UNIQUE — `useId` is unique per instance before the strip and the
 * strip is injective over React's own alphabet — while staying a legal XML name.
 *
 * It is `useId` rather than a module-scope counter for one reason a counter
 * cannot give: SSR. A counter increments in a different order on the server than
 * during hydration, so the markup React sends and the markup it re-renders
 * reference different gradients and one of them is not there. `useId` is the
 * hook React added for exactly this and is stable across the two passes.
 *
 * An SVG that defines a gradient, clip, pattern or filter takes its
 * ids from here; the returned prefix ends in `-`, so callers append a bare
 * suffix (`${prefix}fill`).
 */
export function useSvgIdPrefix(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, '')}-`;
}
