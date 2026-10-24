import { useContext, useLayoutEffect, useMemo, useState, type ReactElement } from 'react';

import {
  createViewableKeysStore,
  useKeyRank,
  VideoViewabilityContext,
  viewabilitySourceOf,
  type ViewabilitySource,
} from './context';
import type { VideoViewabilityProviderProps, VideoViewabilityScopeProps } from './types';

/**
 * Mounted by a list that owns viewability for the players inside it (native
 * feeds and pagers). Players below match by their `viewabilityKey`; a player
 * whose key is not on screen is NOT visible.
 */
export function VideoViewabilityProvider(props: VideoViewabilityProviderProps): ReactElement {
  const { viewableKeys, store } = props;
  // Seeded from the first set so the first render already resolves.
  const [ownStore] = useState(() => createViewableKeysStore(viewableKeys));
  // Layout, not passive: the new set must land in the commit that produced it,
  // or a scrolled-away player would keep its slot for a frame.
  useLayoutEffect(() => {
    if (viewableKeys) ownStore.publish(viewableKeys);
  }, [ownStore, viewableKeys]);

  // The Context value never changes: a new viewable set travels through the
  // store, so it reaches only the players whose own rank moved.
  return (
    <VideoViewabilityContext.Provider value={viewabilitySourceOf(store ?? ownStore)}>
      {props.children}
    </VideoViewabilityContext.Provider>
  );
}

/**
 * Binds a whole subtree to ONE key of the nearest viewability source, for the
 * parts of a list it cannot address individually: its header (not a data row,
 * so never in `onViewableItemsChanged`) and rows whose players are keyed by
 * something the list does not know.
 *
 * Every player inside is visible exactly while `viewabilityKey` is on screen.
 * With no key source above, nothing inside plays: the ambiguous direction is
 * silence, never sound.
 */
export function VideoViewabilityScope({
  viewabilityKey,
  children,
}: VideoViewabilityScopeProps): ReactElement {
  const source = useContext(VideoViewabilityContext);
  // Subscribed to this scope's OWN key: rows moving below do not re-render it.
  const rank = useKeyRank(source, viewabilityKey);
  const scope = useMemo<ViewabilitySource>(
    () => ({ kind: 'scope', visible: rank !== undefined, order: rank ?? 0 }),
    [rank],
  );

  return (
    <VideoViewabilityContext.Provider value={scope}>{children}</VideoViewabilityContext.Provider>
  );
}
