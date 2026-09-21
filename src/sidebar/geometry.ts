import { createContext, useContext } from 'react';
import type { SidebarMetrics } from './metrics';
import type { SidebarSurface } from './types';

export const SIDEBAR_ACTION_DIAMETER = 56;

/** The lane is shared by every collapsed control, independently of row height. */
export function resolveSidebarGeometry(metrics: SidebarMetrics, surface: SidebarSurface, hasAction: boolean, hasTree = false) {
  const expandedInset = hasTree ? 0 : 2;
  const collapsedLane = Math.max(metrics.row.square, hasAction ? SIDEBAR_ACTION_DIAMETER : 0);
  const borderWidth = surface === 'card' ? 2 : surface === 'docked' ? 1 : 0;
  return {
    expandedInset,
    expandedLane: metrics.row.square + expandedInset * 2,
    collapsedLane,
    collapsedWidth: collapsedLane + metrics.collapsedPaddingX * 2 + borderWidth,
  };
}
const SidebarGeometryContext = createContext<ReturnType<typeof resolveSidebarGeometry> | null>(null);
export const SidebarGeometryProvider = SidebarGeometryContext.Provider;
export function useSidebarGeometry() { return useContext(SidebarGeometryContext); }
