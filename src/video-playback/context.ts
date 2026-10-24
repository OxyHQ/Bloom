import { createContext, type RefObject, useSyncExternalStore } from 'react';

import type { ViewRef } from '../styles/native-refs';
import type { ViewableKeysStore } from './types';

/**
 * A value with keyed readers, outside React state.
 *
 * Both high-frequency inputs (the audible slot and a list's viewable set) change
 * on scroll, and a Context carrying either wakes EVERY mounted player: a
 * virtualized list's render-ahead keeps far more mounted than are on screen.
 * Measured with twenty memoized players, one row scrolling into view re-rendered
 * all twenty-one, and a scroll step rendered each of them twice. Instead each
 * player reads its OWN slice through `useSyncExternalStore` ("am I active",
 * "what is my rank") and React skips the re-render when that slice is unchanged.
 */
export interface ValueStore<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (onStoreChange: () => void) => () => void;
}

export function createValueStore<T>(initial: T): ValueStore<T> {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next) => {
      if (Object.is(next, current)) return;
      current = next;
      for (const listener of listeners) listener();
    },
    subscribe: (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
  };
}

const subscribeNothing = (): (() => void) => () => {};

export interface PlayerRegistration {
  /** Silent players never compete for the single audible slot. */
  silent: boolean;
  /**
   * Visible AND on a visible screen, or the owner of an open PiP session, whose
   * surface is deliberately no longer the on-screen one. Screen visibility
   * belongs in candidacy, not only in the final gate: a blurred screen's player
   * is often still intersecting the viewport, and if it could hold the audible
   * slot it would silence the video on the screen the viewer navigated to.
   */
  eligible: boolean;
  /**
   * Ordering input for the audible slot. Web: the player's viewport centre-Y,
   * turned into a distance from the ideal line at selection time. Native: the
   * player's index in its list's viewable order, so the topmost viewable wins.
   */
  order: number;
  /**
   * Web: the view whose CURRENT centre-Y is measured at selection time. An
   * `IntersectionObserver` fires only on a threshold crossing, so a player that
   * stays visible while the page scrolls keeps reporting the position it had on
   * the way in. Measured with two video rows 159px and 370px from the ideal
   * line: the LOWER one held the slot in four runs of four, ranked by where the
   * upper one used to be.
   */
  target?: RefObject<ViewRef | null>;
  /** This player owns the OS Picture-in-Picture window. */
  ownsSession: boolean;
}

export interface VideoPlaybackContextValue {
  /** The single player allowed to be audible, or `null`. A new winner wakes only the old and the new one. */
  active: ValueStore<string | null>;
  publish: (id: string, registration: PlayerRegistration) => void;
  unpublish: (id: string) => void;
  claimActive: (id: string) => void;
}

export const VideoPlaybackContext = createContext<VideoPlaybackContextValue | null>(null);
VideoPlaybackContext.displayName = 'VideoPlaybackContext';

/**
 * What the nearest viewability owner says about the players below it.
 *
 * - `keys`: a list publishing everything on screen as `key → index in on-screen
 *   order`. A player matches by its own key and reads only its own rank.
 * - `scope`: one resolved answer for a whole subtree, for players the list
 *   cannot address by key (its header, a row whose players are keyed otherwise).
 *
 * `null` means no owner at all, the only case that resolves to visible.
 */
export type ViewabilitySource =
  | { kind: 'keys'; order: ValueStore<ReadonlyMap<string, number>> }
  | { kind: 'scope'; visible: boolean; order: number };

export const VideoViewabilityContext = createContext<ViewabilitySource | null>(null);
VideoViewabilityContext.displayName = 'VideoViewabilityContext';

/**
 * The rank `key` holds in the nearest KEY source, subscribed to that one key.
 * `undefined` = not on screen, or no key source to be on screen in.
 */
export function useKeyRank(
  source: ViewabilitySource | null,
  key: string | undefined,
): number | undefined {
  const order = source?.kind === 'keys' ? source.order : null;
  const read = (): number | undefined =>
    order === null || key === undefined ? undefined : order.get().get(key);
  return useSyncExternalStore(order === null ? subscribeNothing : order.subscribe, read, read);
}

/**
 * Native visibility and audible-slot order for one player. An unmatched player
 * under an existing owner is NOT visible: "unknown, so assume yes" is exactly
 * how a scrolled-past video keeps playing.
 */
export function resolveNativeVisibility(
  source: ViewabilitySource | null,
  keyRank: number | undefined,
): { visible: boolean; order: number } {
  if (source === null) return { visible: true, order: 0 };
  if (source.kind === 'scope') return { visible: source.visible, order: source.order };
  return { visible: keyRank !== undefined, order: keyRank ?? 0 };
}

function rankKeys(keys: ReadonlySet<string>): ReadonlyMap<string, number> {
  const order = new Map<string, number>();
  let index = 0;
  for (const key of keys) {
    order.set(key, index);
    index += 1;
  }
  return order;
}

/** Compared in ITERATION order: the published order IS the ranking, so a reorder is a change. */
function sameKeys(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  const next = b.values();
  for (const key of a) {
    if (next.next().value !== key) return false;
  }
  return true;
}

const NO_VIEWABLE_KEYS: ReadonlySet<string> = new Set<string>();

/** The source behind each store, kept off the public object so it stays `publish` only. */
const SOURCES = new WeakMap<ViewableKeysStore, ViewabilitySource & { kind: 'keys' }>();

/**
 * Make the store a list publishes its on-screen keys into, from its viewability
 * and scroll callbacks: the players whose own rank moved re-render, and the
 * list does not. Holding the set in the list's state re-rendered the whole list
 * on every viewability change.
 */
export function createViewableKeysStore(
  initial: ReadonlySet<string> = NO_VIEWABLE_KEYS,
): ViewableKeysStore {
  const order = createValueStore(rankKeys(initial));
  let published = initial;
  const store: ViewableKeysStore = {
    publish: (keys) => {
      if (sameKeys(published, keys)) return;
      published = keys;
      order.set(rankKeys(keys));
    },
  };
  SOURCES.set(store, { kind: 'keys', order });
  return store;
}

export function viewabilitySourceOf(store: ViewableKeysStore): ViewabilitySource {
  const source = SOURCES.get(store);
  if (!source)
    throw new Error('VideoViewabilityProvider: pass a store from createViewableKeysStore()');
  return source;
}
