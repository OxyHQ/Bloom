/**
 * Placement arithmetic for a portaled dropdown surface — shared by the web
 * `Menu` and `ContextMenu` forks, which anchor differently (a trigger's rect
 * vs. a right-click point) but need the same fit / flip / clamp decision.
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
   * Which of the surface's horizontal edges lines up with the anchor's matching
   * edge: `'start'` pins left-to-left (a menu opening rightward from a click),
   * `'end'` pins right-to-right (a trigger-anchored dropdown).
   */
  align: 'start' | 'end';
}

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
 * Resolve the viewport-relative `top`/`left` for a dropdown surface.
 *
 * Vertical: sit below the anchor when it fits, else flip above it, else clamp
 * into the viewport. Horizontal: align per `align`, then clamp into the
 * viewport.
 */
export function resolveDropdownPlacement({
  anchor,
  size,
  viewport,
  offset,
  gutter,
  align,
}: DropdownPlacementInput): DropdownPlacement {
  const below = anchor.bottom + offset;
  const above = anchor.top - offset - size.height;

  const fitsBelow = below + size.height <= viewport.height - gutter;
  const fitsAbove = above >= gutter;

  const top = fitsBelow
    ? below
    : fitsAbove
      ? above
      : clamp(below, gutter, viewport.height - gutter - size.height);

  const preferredLeft = align === 'end' ? anchor.right - size.width : anchor.left;
  const left = clamp(preferredLeft, gutter, viewport.width - gutter - size.width);

  return { top, left };
}
