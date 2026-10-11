import { useMemo } from 'react';
import { Easing } from 'react-native-reanimated';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { resolveSurfaceTransition } from './surface-transition';
import type { SurfaceTransition } from './types';

/** Stable timing values keep unrelated surface renders from restarting motion. */
export function useSurfaceTransition(transition: SurfaceTransition | undefined) {
  const reducedMotion = usePrefersReducedMotion();
  const resolved = resolveSurfaceTransition(transition);
  const [x1, y1, x2, y2] = resolved.easing;
  const easing = useMemo(() => Easing.bezier(x1, y1, x2, y2), [x1, y1, x2, y2]);
  return {
    ...resolved,
    easing,
    reducedMotion,
    duration: reducedMotion ? 0 : transition ? resolved.duration : undefined,
  };
}
