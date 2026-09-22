/**
 * Window-edge geometry and screen-scope coordination, shared by every floating
 * surface and every piece of scroll-linked chrome.
 *
 * `edge` answers "how far from the edge"; `bottom-edge` and `top-edge` answer
 * "what is already parked there"; `scroll-offset` answers "which scroller am I
 * following". A surface that floats at an edge needs the first two; chrome that
 * reacts to scrolling needs the third. `screen-scope` answers "am I my own
 * screen" — a modal or a sheet, whose chrome must claim and read its own edges
 * rather than the screen's underneath.
 */
export { EDGE_GAP, windowEdgeGap } from './edge';
export { BottomEdgeProvider, useBottomEdgeInset, useClaimBottomEdge } from './bottom-edge';
export { TopEdgeProvider, useClaimTopEdge, useTopEdgeInset } from './top-edge';
export { ScrollOffsetProvider, useScrollOffset } from './scroll-offset';
export { ScreenScope } from './screen-scope';

export { HeaderDockProvider, useHeaderDockInset } from './header-dock';
export { StickySection } from './StickySection';
export type { StickySectionProps } from './StickySection';
