import type { ReactNode, RefObject } from 'react';

import type { VideoPlayerLike } from '../media-flight/expo-video-module';
import type { ViewRef } from '../styles/native-refs';

export interface VideoPlaybackProviderProps {
  children: ReactNode;
}

/**
 * The keys a list has on screen, in on-screen order, published from its
 * viewability callbacks. Made with `createViewableKeysStore()` and handed to
 * {@link VideoViewabilityProviderProps.store}.
 */
export interface ViewableKeysStore {
  /**
   * Publish what is on screen now. A `Set` keeps insertion order, so the order
   * the list adds keys in (top of the list first) is the rank the audible slot
   * is decided by. An unchanged set, in the same order, wakes nobody.
   */
  publish: (keys: ReadonlySet<string>) => void;
}

/**
 * A list that owns viewability for the players inside it. One that publishes
 * from callbacks passes its own `store`; one that derives the set while
 * rendering passes `viewableKeys`.
 */
export type VideoViewabilityProviderProps = { children: ReactNode } & (
  | { viewableKeys: ReadonlySet<string>; store?: never }
  | { store: ViewableKeysStore; viewableKeys?: never }
);

export interface VideoViewabilityScopeProps {
  /** The key of the nearest viewability source this whole subtree is visible by. */
  viewabilityKey: string;
  children: ReactNode;
}

export interface UseVideoPlaybackOptions {
  /** Stable identity of this player instance (`useId()` is enough). */
  id: string;
  /**
   * Web: the view this player paints in. The hook observes it with an
   * `IntersectionObserver` (visible = at least half of it on screen) and reads
   * its current centre when the audible slot is decided. Omit it to report
   * visibility yourself through {@link UseVideoPlaybackResult.reportVisibility}.
   * Ignored on native, where visibility comes from the nearest
   * `VideoViewabilityProvider`.
   */
  target?: RefObject<ViewRef | null>;
  /** Key this player is known by to the nearest viewability source; omit outside a list. */
  viewabilityKey?: string;
  /** Silent players (a muted looping GIF) never compete for the single audible slot. */
  silent?: boolean;
  /**
   * Set while this player owns the OS Picture-in-Picture window: it then keeps
   * the audible slot and may play whatever the app's layout and foreground state
   * say, because the viewer is watching it outside that layout.
   */
  ownsSession?: boolean;
}

export interface UseVideoPlaybackResult {
  /** The ONLY playback signal a player needs. */
  shouldPlay: boolean;
  /** Preloading is allowed only on a visible screen, or for the PiP owner. */
  canLoad: boolean;
  /** Manual play wins: take the audible slot while this player stays visible. */
  claimActive: () => void;
  /**
   * Web: report the player's viewport centre-Y and whether it is on screen, for
   * a surface that knows this better than an observer would (a pager's snapped
   * slide). Not needed with {@link UseVideoPlaybackOptions.target}.
   */
  reportVisibility: (centerY: number, isIntersecting: boolean) => void;
}

export interface UseViewableVisibleOptions {
  /** Native: the key the nearest viewability source knows this row by. */
  viewabilityKey?: string;
  /** Web: the view to observe. */
  target: RefObject<ViewRef | null>;
}

/** One subscription handle, as expo-video's `addListener` returns it. */
export interface VideoPlayerSubscription {
  remove(): void;
}

/**
 * The slice of expo-video's `VideoPlayer` the playback control drives.
 *
 * Structural, like {@link VideoPlayerLike}, so no expo-video type reaches
 * Bloom's emitted declarations; a real `VideoPlayer` satisfies it (pinned by
 * `bun run typescript` over `src/__tests__/VideoPlayback.test.tsx`; ts-jest does
 * not type-check it). Method syntax keeps it assignable
 * across `@types/react` copies.
 */
export interface ControlledVideoPlayer extends VideoPlayerLike {
  readonly status: string;
  addListener(eventName: 'sourceChange', listener: () => void): VideoPlayerSubscription;
  addListener(
    eventName: 'statusChange',
    listener: (payload: { status: string }) => void,
  ): VideoPlayerSubscription;
}
