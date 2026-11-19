import { useContext } from 'react';

import { useKeyNear, VideoViewabilityContext } from './context';

/**
 * Whether the row known by `viewabilityKey` should hold a loaded player: it is
 * on screen, or inside the preload window its list publishes with
 * `ViewableKeysStore.publish(keys, nearKeys)`. A player is attached while its
 * row is near and given back once it leaves, so a list holds a decoder for the
 * rows around the reader rather than for every row it has mounted.
 *
 * With no viewability owner above (a screen without a list, and the web, where
 * players observe themselves) every player is near. Under a
 * `VideoViewabilityScope` it is near exactly while the scope is visible. The
 * screen's own visibility is not part of the answer: a screen in the
 * background keeps its players, so coming back to it shows the same frame.
 */
export function useViewableNear(viewabilityKey: string | undefined): boolean {
  return useKeyNear(useContext(VideoViewabilityContext), viewabilityKey);
}
