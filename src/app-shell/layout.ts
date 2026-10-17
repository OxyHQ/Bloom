/**
 * `AppShell`'s frames: the four boxes a shell can be, and the two ways a region
 * pins itself inside one. Kept apart from the component so the variants share
 * ONE set of rules rather than each re-deriving them.
 */
import { Platform } from 'react-native';

import {
  WEB_POSITION_STICKY,
  WEB_VIEWPORT_HEIGHT,
  webViewportHeightMinus,
  type WebCssStyle,
} from '../styles/web-view-style';
import type { AppShellScroll, AppShellVariant } from './types';

export type ScrollMode = 'document' | 'container' | 'fixed';

/**
 * Which frame a shell actually gets.
 *
 * Native has no document, so `document` falls back to `container` there, and
 * `page` to `fixed`. `canvas` is the other reduction: a canvas IS the viewport
 * (a map that grew the page would pan the page instead of the map), so it
 * resolves `document` and `page` to `fixed` (one screen) and honours
 * `container` for a shell embedded in a bounded box. Several panels side by
 * side need no reduction of their own: `AppShellPanels` is a viewport-tall box
 * in a document, so the page simply has nothing to scroll.
 */
export function resolveScrollMode(variant: AppShellVariant, scroll: AppShellScroll): ScrollMode {
  if (variant === 'canvas') return scroll === 'container' ? 'container' : 'fixed';
  // `page`: the document where there is one, else one screen whose routes'
  // own ScreenScrollViews scroll.
  if (scroll === 'page') return Platform.OS === 'web' ? 'document' : 'fixed';
  if (scroll === 'document' && Platform.OS !== 'web') return 'container';
  return scroll;
}

/**
 * "Take the rest of the row or column", spelled in LONGHANDS — the only way the
 * shell writes it on a node whose style changes with the scroll mode.
 *
 * Apps switch `scroll` per route, and a region that keeps its DOM node across
 * that re-render receives React DOM's DIFF of its two inline styles rather than
 * either style: a dropped key is cleared with `style[key] = ''`, and only keys
 * whose value changed are written. Clearing a `flex` shorthand clears
 * `flex-grow`/`flex-shrink`/`flex-basis` with it, and a longhand that kept its
 * value is never written back — so a `flex: 1` dropped beside an unchanged
 * `flexGrow` left the reading row with no flex at all, as wide as its
 * content, pushing the sidebar off the page (and React warns "Removing a style
 * property during rerender"). The same happens the other way round, clearing a
 * longhand under an unchanged shorthand. Longhands never collide, so the diff
 * lands what a fresh mount would. `flex` is the shorthand that matters: for an
 * inline style react-native-web expands `padding`, `margin`, `inset`,
 * `overflow` and the border shorthands to longhands itself, but hands `flex`
 * to the DOM as written. Gate: `AppShellScrollSwitch.web.test.tsx`.
 */
export const flexFill: WebCssStyle = { flexGrow: 1, flexShrink: 1, flexBasis: 0 };

/**
 * Document mode: the frame is at least one viewport tall and grows with the
 * page, so the browser scrolls the document (scroll restoration, the address
 * bar collapsing, anchor links, `window.scrollTo`) exactly as it does for a
 * `ContentPanel` page. Nothing here may be a scroll container — no `hidden`
 * overflow — or the sticky rail would stick to a box that never scrolls.
 */
export const documentRoot: WebCssStyle = { flexGrow: 1, minHeight: WEB_VIEWPORT_HEIGHT };

/** Container mode: fill the parent, scroll inside. */
export const containerRoot: WebCssStyle = { ...flexFill, height: '100%', overflow: 'hidden' };

/**
 * Fixed mode: exactly one screen — `100dvh` on web, the parent on native — and
 * nothing scrolls; the content fills the height left under the header.
 */
export const fixedRoot: WebCssStyle =
  Platform.OS === 'web'
    ? { height: WEB_VIEWPORT_HEIGHT, overflow: 'hidden' }
    : { ...flexFill, height: '100%', overflow: 'hidden' };

export function rootFrame(mode: ScrollMode): WebCssStyle {
  return mode === 'document' ? documentRoot : mode === 'fixed' ? fixedRoot : containerRoot;
}

/**
 * A region pinned to the viewport while the document scrolls under it — the nav
 * rail and the aside. `sticky` rather than `fixed` so the region keeps its place
 * in the row: a fixed column is out of flow, and the content beside it would
 * slide underneath.
 */
export function stickyRail(inset: number): WebCssStyle {
  return {
    position: WEB_POSITION_STICKY,
    top: inset,
    height: webViewportHeightMinus(inset * 2),
    alignSelf: 'flex-start',
    flexShrink: 0,
  };
}
