/**
 * Window-edge geometry and screen-scope coordination, shared by every floating
 * surface and every piece of scroll-linked chrome.
 *
 * `edge` answers "how far from the edge"; `bottom-edge` and `top-edge` answer
 * "what is already parked there"; `scroll-offset` answers "which scroller am I
 * following". A surface that floats at an edge needs the first two; chrome that
 * reacts to scrolling needs the third.
 */
export { EDGE_GAP, windowEdgeGap } from './edge';
export { BottomEdgeProvider, useBottomEdgeInset, useClaimBottomEdge } from './bottom-edge';
export { TopEdgeProvider, useClaimTopEdge, useTopEdgeInset } from './top-edge';
export { ScrollOffsetProvider, useScrollOffset } from './scroll-offset';
