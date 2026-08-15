/**
 * Placement arithmetic for a portaled dropdown surface — shared by the web
 * `Menu`, `ContextMenu`, `Select`, `Popover` and SUBMENU forks, which anchor
 * differently (a trigger's rect, a right-click point, a menu row) but need the
 * same fit / flip / clamp decision.
 *
 * BOTH AXES GO THROUGH ONE RESOLVER. `side` names the axis: `'bottom'`/`'top'`
 * make the surface fit-flip-clamp vertically and ALIGN horizontally, and
 * `'right'`/`'left'` (a submenu flying out beside its row) do the same thing
 * with the two axes swapped. They are not two code paths — the same pair of
 * helpers is called with the anchor's edges in the other order, which is the
 * whole reason a submenu did not need a second positioner with its own,
 * differently-wrong clamp.
 *
 * Internal: deliberately NOT re-exported from `overlay/index.ts`. The web forks
 * import it directly, the same way `dialog/SheetShell` is shared without
 * becoming public API.
 *
 * Kept as a pure function so the arithmetic is unit-testable on its own — the
 * DOM half (measuring the surface before positioning it) is the call site's
 * job and is verified in a browser.
 */

/** Viewport-relative box the surface is positioned against. A right-click point is a zero-area anchor. */
export interface DropdownAnchor {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface DropdownPlacementInput {
  anchor: DropdownAnchor;
  /** The surface's size, measured at the width it will finally be laid out at. */
  size: { width: number; height: number };
  viewport: { width: number; height: number };
  /** Gap left between the anchor and the surface on the vertical axis. */
  offset: number;
  /** Minimum distance kept from every viewport edge. */
  gutter: number;
  /**
   * How the surface lines up with the anchor on the CROSS axis — the one `side`
   * does not name. `'start'` pins start-to-start (a menu opening rightward from
   * a click; a submenu whose first row lines up with its trigger), `'end'` pins
   * end-to-end (a trigger-anchored dropdown), `'center'` lines the two midpoints
   * up (a popover under its trigger).
   *
   * `'center'` is not a third special case in the arithmetic — all three pick a
   * preferred offset and then go through the same clamp, which is the whole
   * reason a popover can stop carrying its own positioner.
   */
  align: 'start' | 'end' | 'center';
  /**
   * Which side of the anchor the surface PREFERS, and therefore which axis is
   * the MAIN one. A dropdown always wants `'bottom'`; `Popover` lets its caller
   * ask for `'top'`; a submenu flies out to the `'right'` of its row.
   *
   * It is a preference, not a demand: whichever side is named, the surface flips
   * to the OPPOSITE one when the named side does not fit, and clamps when
   * neither does. All four values are symmetric, not four code paths — which is
   * what let `Popover` and then the submenu stop carrying their own positioners
   * along with their own (one-sided) clamps.
   */
  side: DropdownSide;
}

/** The four sides a surface can prefer. `'left'`/`'right'` make the main axis horizontal. */
export type DropdownSide = 'bottom' | 'top' | 'right' | 'left';

export interface DropdownPlacement {
  top: number;
  left: number;
}

/**
 * Clamp into `[min, max]`, resolving an inverted range to `min`.
 *
 * The range inverts exactly when the surface is larger than the viewport minus
 * its gutters. Preferring `min` then pins the surface to the top/left gutter and
 * lets it overflow the far edge, so its FIRST rows stay reachable — the opposite
 * choice would push its start off-screen and strand every row.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * The MAIN axis: sit on the preferred side of the anchor when the surface fits
 * there, else flip to the other side, else clamp the preferred position into the
 * viewport.
 *
 * Written against a generic axis — `nearEdge`/`farEdge` are the anchor's
 * `top`/`bottom` for a vertical side and its `left`/`right` for a horizontal
 * one — so `'top'`, `'bottom'`, `'left'` and `'right'` are one implementation
 * rather than two that can drift apart.
 */
function resolveMainAxis({
  nearEdge,
  farEdge,
  extent,
  viewportExtent,
  offset,
  gutter,
  prefersNear,
}: {
  nearEdge: number;
  farEdge: number;
  extent: number;
  viewportExtent: number;
  offset: number;
  gutter: number;
  prefersNear: boolean;
}): number {
  const near = nearEdge - offset - extent;
  const far = farEdge + offset;

  const fitsNear = near >= gutter;
  const fitsFar = far + extent <= viewportExtent - gutter;

  const preferred = prefersNear ? near : far;
  const fitsPreferred = prefersNear ? fitsNear : fitsFar;
  const alternative = prefersNear ? far : near;
  const fitsAlternative = prefersNear ? fitsFar : fitsNear;

  if (fitsPreferred) return preferred;
  if (fitsAlternative) return alternative;
  return clamp(preferred, gutter, viewportExtent - gutter - extent);
}

/** The CROSS axis: align against the anchor, then clamp into the viewport. */
function resolveCrossAxis({
  startEdge,
  endEdge,
  extent,
  viewportExtent,
  gutter,
  align,
}: {
  startEdge: number;
  endEdge: number;
  extent: number;
  viewportExtent: number;
  gutter: number;
  align: 'start' | 'end' | 'center';
}): number {
  const preferred =
    align === 'end'
      ? endEdge - extent
      : align === 'center'
        ? (startEdge + endEdge) / 2 - extent / 2
        : startEdge;
  return clamp(preferred, gutter, viewportExtent - gutter - extent);
}

/**
 * Resolve the viewport-relative `top`/`left` for a dropdown surface.
 *
 * `side` picks which axis is which: a vertical side fit-flip-clamps the surface
 * top-to-bottom and aligns it left-to-right, a horizontal one does the reverse.
 */
export function resolveDropdownPlacement({
  anchor,
  size,
  viewport,
  offset,
  gutter,
  align,
  side,
}: DropdownPlacementInput): DropdownPlacement {
  const vertical = side === 'top' || side === 'bottom';

  const main = resolveMainAxis({
    nearEdge: vertical ? anchor.top : anchor.left,
    farEdge: vertical ? anchor.bottom : anchor.right,
    extent: vertical ? size.height : size.width,
    viewportExtent: vertical ? viewport.height : viewport.width,
    offset,
    gutter,
    prefersNear: side === 'top' || side === 'left',
  });

  const cross = resolveCrossAxis({
    startEdge: vertical ? anchor.left : anchor.top,
    endEdge: vertical ? anchor.right : anchor.bottom,
    extent: vertical ? size.width : size.height,
    viewportExtent: vertical ? viewport.width : viewport.height,
    gutter,
    align,
  });

  return vertical ? { top: main, left: cross } : { top: cross, left: main };
}
