/**
 * The optional-peer boundary for `react-native-pager-view`.
 *
 * An app with no swipeable root pages must not be made to install a native
 * module, so the pager is an OPTIONAL peer, loaded in the one shape Metro
 * treats as optional: a `require()` of a string literal as a DIRECT statement of
 * a `try` block (the `typeof require` guard stays outside it — one `if` of
 * nesting and Metro stops marking the dependency optional, failing the build of
 * every app without the package). Same boundary as
 * `media-flight/expo-video-module.ts`.
 *
 * Only the native layout reaches this file; the web layout is a `<Slot/>`, so
 * the package (which has no web implementation) never enters a web bundle.
 */
import type { ComponentType, ReactNode, Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

declare const require: (moduleName: string) => unknown;

/** The pager's imperative handle, as far as Bloom calls it. */
export interface PagerViewHandle {
  setPageWithoutAnimation(page: number): void;
}

export type PageScrollState = 'idle' | 'dragging' | 'settling';

/**
 * The slice of `PagerViewProps` Bloom passes. Hand-written rather than
 * imported so no pager type reaches Bloom's emitted declarations: an app that
 * skips the optional peer must not inherit a missing-module error from them.
 */
export interface PagerViewLikeProps {
  ref?: Ref<PagerViewHandle>;
  style?: StyleProp<ViewStyle>;
  initialPage?: number;
  offscreenPageLimit?: number;
  overdrag?: boolean;
  /** A reanimated event handler, attached to the native view on the UI thread. */
  onPageScroll?: unknown;
  onPageSelected?: (event: { nativeEvent: { position: number } }) => void;
  onPageScrollStateChanged?: (event: { nativeEvent: { pageScrollState: PageScrollState } }) => void;
  children?: ReactNode;
}

let pagerView: ComponentType<PagerViewLikeProps> | null | undefined;
let unavailableReason = '';
let hasWarned = false;

/** `PagerView`, or `null` when the optional peer is not installed. */
export function loadPagerView(): ComponentType<PagerViewLikeProps> | null {
  if (pagerView !== undefined) return pagerView;
  pagerView = null;
  if (typeof require === 'undefined') {
    unavailableReason = 'this bundle has no CommonJS `require`';
    return pagerView;
  }
  try {
    const loaded = require('react-native-pager-view') as
      | { default?: unknown; PagerView?: unknown }
      | null
      | undefined;
    const view = loaded?.default ?? loaded?.PagerView;
    if (typeof view === 'function') pagerView = view as ComponentType<PagerViewLikeProps>;
    else unavailableReason = 'the module resolved without a `PagerView` export';
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : String(error);
  }
  return pagerView;
}

/** One dev warning per module lifetime: the pages still work, without the swipe. */
export function warnPagerViewUnavailable(): void {
  if (process.env.NODE_ENV === 'production' || hasWarned) return;
  hasWarned = true;
  console.warn(
    '[Bloom] The tab pager has no swipe: the optional peer `react-native-pager-view` ' +
      'could not be loaded, so root pages switch by tap only. Install it ' +
      '(`npx expo install react-native-pager-view`) for the swipe between pages. ' +
      `Reason: ${unavailableReason}`,
  );
}
