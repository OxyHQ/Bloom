import type { ReactNode, RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * Anything `useScrollRestoration` knows how to read/write a vertical scroll
 * offset from. The hook accepts a ref to one of these:
 *
 * - a React Native `ScrollView` / `FlatList` / `FlashList` ref (which on web is
 *   backed by a DOM node and exposes `getScrollableNode()`),
 * - a raw DOM element ref (when a component renders its own scroll container),
 * - the literal `'window'` sentinel, for the layout where the list IS the
 *   document scroller.
 *
 * The two imperative methods are the native write path; web writes `scrollTop`
 * on the resolved DOM node instead. Both are optional because a given ref only
 * ever exposes one of them (list vs. scroll view).
 */
export interface ScrollableHandle {
  /** `ScrollView`'s imperative scroll API. */
  scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
  /** `FlatList`/`FlashList`'s imperative scroll API. */
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
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

/** The effect shape `useScreenFocusEffect` runs — mirrors `useEffect`'s. */
export type ScreenFocusEffect = () => (() => void) | void;

/**
 * The router bindings the scroll core needs, and the ONLY thing it knows about
 * routing. Keeping this to two hooks is what lets the core ship without a
 * router import, so a Vite/SPA consumer can supply its own adapter (or none).
 *
 * Both members are HOOKS: the core calls them from `useScrollRestoration`, so
 * the adapter value must be referentially stable for the lifetime of the
 * provider (a module-level constant, which is what every adapter Bloom ships
 * is). Swapping in a different adapter at runtime would change the hook order
 * of every consumer below it.
 */
export interface ScrollRouterAdapter {
  /**
   * Identify WHAT the calling screen is showing — its route and params, not the
   * history slot it occupies. Offsets are remembered per content, so returning
   * to something already seen restores it however the user got there.
   *
   * It must describe the screen the CALLER is rendered inside, never the
   * globally focused one: a background screen has to keep reporting its own
   * content, or it would save its offset under the foreground screen's key.
   *
   * `null` when the adapter cannot answer (a scrollable rendered outside any
   * navigator), which makes the hook inert rather than guessing.
   */
  useScreenContentId(): string | null;
  /**
   * Run `effect` while the calling screen is focused, and its cleanup on blur.
   * Re-runs when `effect`'s identity changes AND the screen is focused — that
   * is what makes an in-screen key change (a tab or folder swap) visible to a
   * hook that never blurred.
   */
  useScreenFocusEffect(effect: ScreenFocusEffect): void;
}

export interface UseScrollRestorationOptions {
  /**
   * Sub-key distinguishing scrollables that share one screen AND one content
   * id — the tabs of a profile, the folders of a saved-items screen. Changing
   * it while the screen stays focused saves the outgoing list's offset and
   * restores (or resets) the incoming one.
   */
  key?: string;
  /**
   * When `false` the hook is completely inert: no save, no restore, no reset.
   *
   * On NATIVE this is load-bearing rather than a feature flag. Restoring into a
   * list whose rows have not been laid out yet lands at the wrong place (or is
   * clamped away), and native has no equivalent of the web path's re-apply
   * loop — so the caller gates on its own content being present, e.g.
   * `enabled: rows.length > 0`. Flipping it from `false` to `true` is what
   * triggers the restore.
   *
   * Defaults to `true`.
   */
  enabled?: boolean;
}

/**
 * What `useScrollRestoration` hands back. Identical on both platforms so call
 * sites are written once.
 */
export interface ScrollRestorationBinding {
  /**
   * Wire onto the list being restored: `<FlashList onScroll={scroll.onScroll}>`.
   *
   * Native has no way to observe a list's offset from outside it, so this is
   * how offsets are recorded there. On web it is a stable no-op — the web path
   * subscribes to the resolved DOM node's own `scroll` event, which needs
   * nothing from the caller — and passing it costs nothing.
   */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /**
   * Whether a write to the scroller is still coming. Lets a caller hold the
   * content invisible until the offset has landed, so the settle is never seen
   * — keep it LAID OUT (`opacity: 0`), never `display: none`, which collapses
   * the document and makes every write clamp to 0.
   *
   * It falls to `false` on whichever comes first: the restore sticks, it
   * exhausts the frame budget, or the user takes over. Waiting past any of
   * those is waiting for something that has already stopped trying.
   *
   * The two platforms answer it honestly rather than identically, because the
   * thing being waited for differs. WEB: `true` only while the multi-frame
   * restore loop is in flight — a reset writes 0 synchronously inside the
   * effect, so there is nothing left to wait for and it stays `false`. NATIVE:
   * `true` from the effect until the deferred write lands one frame later,
   * which covers a reset too, since that write is deferred as well.
   */
  restorePending: boolean;
}

export interface ScrollRestorationProviderProps {
  children: ReactNode;
  /**
   * Binds the store to a router. Must be referentially stable — see
   * {@link ScrollRouterAdapter}.
   */
  adapter: ScrollRouterAdapter;
}
