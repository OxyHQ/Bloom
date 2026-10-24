import { useContext, useEffect, useState } from 'react';

import { IS_WEB } from '../styles/platform';
import { useScreenVisible } from '../screen/use-screen-visible';
import { resolveNativeVisibility, useKeyRank, VideoViewabilityContext } from './context';
import { domElementOf } from './dom-element';
import type { UseViewableVisibleOptions } from './types';

/**
 * Whether a view that is not a video (an embed that loads or animates only
 * while seen) is in front of the reader: its screen is visible AND the view is
 * on screen. Native reads the same measured row set the players do, from the
 * nearest `VideoViewabilityProvider` / `VideoViewabilityScope`, and never treats
 * a render-ahead row as visible; web observes `target` (any pixel counts).
 */
export function useViewableVisible({ viewabilityKey, target }: UseViewableVisibleOptions): boolean {
  const screenVisible = useScreenVisible();
  const source = useContext(VideoViewabilityContext);
  const rank = useKeyRank(source, viewabilityKey);
  const [intersecting, setIntersecting] = useState(false);

  useEffect(() => {
    if (!IS_WEB) return;
    const element = domElementOf(target.current);
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      setIntersecting(entries.some((entry) => entry.isIntersecting));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);

  return screenVisible && (IS_WEB ? intersecting : resolveNativeVisibility(source, rank).visible);
}
