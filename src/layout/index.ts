/**
 * Window-edge geometry, shared by every floating surface.
 *
 * `edge` answers "how far from the edge"; `bottom-edge` answers "what is already
 * parked there". A surface that floats at the bottom needs both.
 */
export { EDGE_GAP, windowEdgeGap } from './edge';
export {
  BottomEdgeProvider,
  useBottomEdgeInset,
  useBottomEdgeCollapsed,
  useClaimBottomEdge,
} from './bottom-edge';
