import { cornerValues, resolveConcentricCorners } from '../concentric/geometry';
import type { PlatformWindowMetrics } from '../platform-surface/types';

/**
 * The window's toolbar row: twice the controls' centre line from the window's
 * top, so a title row in it is centred on the controls (52 on OxyOS, whose
 * centres are 26 down). A header that is the window's title area starts at
 * the window's top edge and is this tall.
 */
export function windowToolbarHeight(metrics: PlatformWindowMetrics): number {
  return 2 * (metrics.controls.top + metrics.controls.height / 2);
}

/**
 * The top corners of a panel along the window's top edge, concentric with the
 * window's own corners (Bloom's concentric rule: the window's radius less the
 * smaller of the two gaps beside each corner). The panel starts at the
 * window's top, so that gap is 0 and the top corners take the window's
 * radius, whatever the side inset: a pane at the top leading corner has the
 * window's own curve there. Its bottom corners keep the panel's radius.
 */
export function windowEdgeTopCorners(metrics: PlatformWindowMetrics): {
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
} {
  const corners = resolveConcentricCorners(cornerValues(metrics.radius), {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  return { borderTopLeftRadius: corners.topLeft, borderTopRightRadius: corners.topRight };
}
