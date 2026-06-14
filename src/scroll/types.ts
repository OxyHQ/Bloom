import type { ReactNode, RefObject } from 'react';

/**
 * Anything `useScrollRestoration` knows how to read/write a vertical scroll
 * offset from. The hook accepts a ref to one of these:
 *
 * - a React Native `ScrollView` / `FlatList` ref (which on web is backed by a
 *   DOM node and exposes `getScrollableNode()`),
 * - a raw DOM element ref (when a component renders its own scroll container),
 * - the literal `'window'` sentinel, for the rare layout where the list IS the
 *   window scroller (matches Bluesky's default).
 *
 * Native never reads any of these — the native hook is a no-op — so the type is
 * intentionally permissive rather than coupled to a specific RN class.
 */
export interface ScrollableHandle {
  /** Imperative scroll API exposed by RN scrollables. */
  scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
  /** Web/RNW path: returns the underlying DOM node. */
  getScrollableNode?: () => unknown;
}

/**
 * The accepted ref shapes. `'window'` is a sentinel for the document scroller.
 */
export type ScrollRestorationTarget =
  | RefObject<ScrollableHandle | null>
  | RefObject<unknown>
  | 'window';

export interface UseScrollRestorationOptions {
  /**
   * Sub-key to disambiguate multiple scrollables that live on the same route
   * (e.g. the tabs of a profile screen). Combined with the active route key to
   * form the storage key. Omit when a route has a single scrollable.
   */
  key?: string;
  /**
   * When `false`, the hook is inert (saves and restores are skipped). Useful to
   * gate restoration behind a feature flag without changing call sites.
   * Defaults to `true`.
   */
  enabled?: boolean;
}

export interface ScrollRestorationProviderProps {
  children: ReactNode;
}
