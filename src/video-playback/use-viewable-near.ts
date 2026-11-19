import { useContext } from 'react';

import { useScreenVisible } from '../screen/use-screen-visible';
import {
  resolveNativeVisibility,
  useKeyNear,
  useKeyRank,
  VideoViewabilityContext,
} from './context';

/**
 * Whether the row known by `viewabilityKey` should hold a loaded player: it is
 * on screen, or inside the preload window its list publishes with
 * `ViewableKeysStore.publish(keys, nearKeys)`. A player is attached while its
 * row is near and given back once it leaves, so a list holds a decoder for the
 * rows around the reader rather than for every row it has mounted.
 *
 * A screen in the background keeps only its on-screen rows: the frame the
 * reader comes back to stays, and the preloaded rows give their decoders to
 * the screen in front (the same rule a reel pager follows when it is left).
 *
 * With no viewability owner above (a screen without a list, and the web, where
 * players observe themselves) every player is near. Under a
 * `VideoViewabilityScope` it is near exactly while the scope is visible.
 */
export function useViewableNear(viewabilityKey: string | undefined): boolean {
  const source = useContext(VideoViewabilityContext);
  const near = useKeyNear(source, viewabilityKey);
  const rank = useKeyRank(source, viewabilityKey);
  const screenVisible = useScreenVisible();
  return screenVisible ? near : resolveNativeVisibility(source, rank).visible;
}
