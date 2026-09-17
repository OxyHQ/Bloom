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
 * Native has no document, so `document` falls back to `container` there.
 * `split` is the other reduction: its panes each own their scrolling, which is
 * only expressible inside a bounded box — a document-scrolling split would have
 * one pane growing the page and the others pinned to nothing. So `split`
 * resolves `document` to `fixed` (one screen) and honours `container` as-is.
 */
export function resolveScrollMode(variant: AppShellVariant, scroll: AppShellScroll): ScrollMode {
  if (variant === 'split') return scroll === 'container' ? 'container' : 'fixed';
  if (scroll === 'document' && Platform.OS !== 'web') return 'container';
  return scroll;
}

/**
 * Document mode: the frame is at least one viewport tall and grows with the
 * page, so the browser scrolls the document (scroll restoration, the address
 * bar collapsing, anchor links, `window.scrollTo`) exactly as it does for a
 * `ContentPanel` page. Nothing here may be a scroll container — no `hidden`
 * overflow — or the sticky rail would stick to a box that never scrolls.
 */
export const documentRoot: WebCssStyle = { flexGrow: 1, minHeight: WEB_VIEWPORT_HEIGHT };

/** Container mode: fill the parent, scroll inside. */
export const containerRoot: WebCssStyle = { flex: 1, height: '100%', overflow: 'hidden' };

/**
 * Fixed mode: exactly one screen — `100dvh` on web, the parent on native — and
 * nothing scrolls; the content fills the height left under the header.
 */
export const fixedRoot: WebCssStyle =
  Platform.OS === 'web'
    ? { height: WEB_VIEWPORT_HEIGHT, overflow: 'hidden' }
    : { flex: 1, height: '100%', overflow: 'hidden' };

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
