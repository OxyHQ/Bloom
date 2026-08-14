import { createContext, useContext } from 'react';

import type { SurfaceControls } from './types';

/**
 * Context carrying the CURRENT surface's controls. The host wraps each presented
 * surface's content in a provider bound to that entry's id, so a nested surface
 * reads its OWN controls — `dismiss` targets this surface, `present` stacks a
 * child above it.
 */
export const SurfaceContext = createContext<SurfaceControls | null>(null);
SurfaceContext.displayName = 'BloomSurfaceContext';

/**
 * Read the current surface's {@link SurfaceControls} from inside a presented
 * surface. Equivalent to the `surface` argument the render function receives —
 * use whichever is convenient (props vs. context).
 *
 * DEPTH only: `dismiss` (resolve this surface's promise + close) and `present`
 * (stack a child). Navigation within a surface is the SDK's route layer, not
 * this hook.
 *
 * @throws if called outside a presented surface.
 */
export function useSurface(): SurfaceControls {
  const controls = useContext(SurfaceContext);
  if (!controls) {
    throw new Error(
      'useSurface must be called from within a presented surface (rendered by <SurfaceProvider>/<SurfaceHost>).',
    );
  }
  return controls;
}
