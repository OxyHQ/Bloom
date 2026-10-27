import type { MotionSpec } from '../motion/spec';
import type {
  PanelDropEdge,
  PanelDropPoint,
  PanelDropStage,
  PanelDropTarget,
} from './panel-layout-types';

export interface PanelDropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Each stage as fractions of its panel, measured on a desktop browser's split
 * targets: `width` along the edge's normal, `height` along the edge, `inset`
 * from the edge as a fraction of the panel's extent along the normal.
 */
export const PANEL_DROP_STAGES: Readonly<
  Record<PanelDropStage, { width: number; height: number; inset: number }>
> = {
  rest: { width: 0.1324, height: 0.383, inset: 0.025 },
  grown: { width: 0.215, height: 0.611, inset: 0.02 },
  active: { width: 0.241, height: 0.69, inset: 0.02 },
};
/** How far the active target's centre moves toward the pointer. */
export const PANEL_DROP_LEAN = 0.43;
export const PANEL_DROP_PREVIEW = { width: 209, height: 110 } as const;
export const PANEL_DROP_EDGES: readonly PanelDropEdge[] = ['start', 'end'];
export const PANEL_DROP_MOTION: Readonly<{ slide: MotionSpec; grow: MotionSpec }> = {
  slide: { duration: 110, easing: [0.25, 0.1, 0.25, 1] },
  grow: { response: 0.2, dampingRatio: 0.9 },
};

type PhysicalEdge = 'left' | 'right' | 'top' | 'bottom';
export function physicalDropEdge(edge: PanelDropEdge, rtl: boolean): PhysicalEdge {
  if (edge === 'start') return rtl ? 'right' : 'left';
  if (edge === 'end') return rtl ? 'left' : 'right';
  return edge;
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

/**
 * A target's box inside `panel` (same coordinate space). The active stage leans
 * its centre toward `pointer` along the edge's normal, staying inside the
 * panel's inset.
 */
export function panelDropZoneRect(
  panel: PanelDropRect,
  edge: PanelDropEdge,
  stage: PanelDropStage,
  pointer?: PanelDropPoint | null,
  rtl = false,
): PanelDropRect {
  const side = physicalDropEdge(edge, rtl);
  const horizontal = side === 'left' || side === 'right';
  const s = PANEL_DROP_STAGES[stage];
  const normal = horizontal ? panel.width : panel.height;
  const along = horizontal ? panel.height : panel.width;
  const depth = normal * s.width;
  const length = along * s.height;
  const inset = normal * s.inset;
  const origin = horizontal ? panel.x : panel.y;
  const cross = (horizontal ? panel.y : panel.x) + (along - length) / 2;
  const leading = side === 'left' || side === 'top';
  let start = leading ? origin + inset : origin + normal - inset - depth;
  if (stage === 'active' && pointer) {
    const home = panelDropZoneRect(panel, edge, 'grown', null, rtl);
    const centre = horizontal ? home.x + home.width / 2 : home.y + home.height / 2;
    const target = horizontal ? pointer.x : pointer.y;
    const lean = centre + (target - centre) * PANEL_DROP_LEAN;
    start = clamp(lean - depth / 2, origin + inset, origin + normal - inset - depth);
  }
  return horizontal
    ? { x: start, y: cross, width: depth, height: length }
    : { x: cross, y: start, width: length, height: depth };
}

/** Where a target waits before it slides in: just past its panel's edge. */
export function panelDropZoneEntry(
  panel: PanelDropRect,
  edge: PanelDropEdge,
  rtl = false,
): PanelDropRect {
  const rest = panelDropZoneRect(panel, edge, 'rest', null, rtl);
  switch (physicalDropEdge(edge, rtl)) {
    case 'left':
      return { ...rest, x: panel.x - rest.width };
    case 'right':
      return { ...rest, x: panel.x + panel.width };
    case 'top':
      return { ...rest, y: panel.y - rest.height };
    default:
      return { ...rest, y: panel.y + panel.height };
  }
}

const contains = (rect: PanelDropRect, point: PanelDropPoint) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;
const overlaps = (a: PanelDropRect, b: PanelDropRect) =>
  a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height;

export interface ResolvePanelDropOptions {
  /** Accepting panels by id, in the same coordinate space as `point`. */
  panels: Readonly<Record<string, PanelDropRect>>;
  /** Where the pointer must be for any target to resolve: every visible panel,
   * including one that does not accept the drop (the dragged item's own). Default `panels`. */
  over?: Readonly<Record<string, PanelDropRect>>;
  point: PanelDropPoint | null | undefined;
  /** The target already under the drag keeps its larger, active box. */
  current?: PanelDropTarget | null;
  edges?: readonly PanelDropEdge[];
  preview?: { width: number; height: number };
  rtl?: boolean;
}

/**
 * The target a drag lands on: the dragged picture (centred on the pointer)
 * must overlap a grown target, the pointer must be over a panel (`over`),
 * and the nearest target centre wins. The current target is measured at its
 * active size and always wins while it still overlaps, so a target does not
 * flicker between neighbours.
 */
export function resolvePanelDropTarget({
  panels,
  over = panels,
  point,
  current = null,
  edges = PANEL_DROP_EDGES,
  preview = PANEL_DROP_PREVIEW,
  rtl = false,
}: ResolvePanelDropOptions): PanelDropTarget | null {
  if (!point) return null;
  const rects = Object.entries(panels);
  if (!Object.values(over).some((rect) => contains(rect, point))) return null;
  const width = Math.max(0, preview.width);
  const height = Math.max(0, preview.height);
  const card = { x: point.x - width / 2, y: point.y - height / 2, width, height };
  let best: (PanelDropTarget & { distance: number }) | null = null;
  for (const [panelId, rect] of rects) {
    for (const edge of edges) {
      const keep = current?.panelId === panelId && current.edge === edge;
      const zone = panelDropZoneRect(rect, edge, keep ? 'active' : 'grown', point, rtl);
      if (!overlaps(card, zone)) continue;
      const side = physicalDropEdge(edge, rtl);
      const horizontal = side === 'left' || side === 'right';
      const distance = keep
        ? -1
        : horizontal
          ? Math.abs(zone.x + zone.width / 2 - point.x)
          : Math.abs(zone.y + zone.height / 2 - point.y);
      if (!best || distance < best.distance) best = { panelId, edge, distance };
    }
  }
  return best && { panelId: best.panelId, edge: best.edge };
}
