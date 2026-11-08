import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useScreenVisible } from '../screen/use-screen-visible';
import { COMPOSER_LOADER_FADE_MS } from './shared';

/** Keep moving through the visible fade, but never while the owner is hidden. */
export function useLoaderMotion(active: boolean, visible: boolean) {
  const reducedMotion = usePrefersReducedMotion();
  const screenVisible = useScreenVisible();
  const enabled = visible && screenVisible && !reducedMotion;
  const [finishing, setFinishing] = useState(active && enabled);
  useEffect(() => {
    if (!enabled || active) {
      setFinishing(active && enabled);
      return;
    }
    if (!finishing) return;
    const stop = setTimeout(() => setFinishing(false), COMPOSER_LOADER_FADE_MS);
    return () => clearTimeout(stop);
  }, [active, enabled, finishing]);
  return { moving: enabled && (active || finishing), animate: enabled };
}
