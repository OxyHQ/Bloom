/**
 * Placement arithmetic for a portaled dropdown surface — shared by the web
 * `Menu`, `ContextMenu`, `Select` and `Popover` forks, which anchor differently
 * (a trigger's rect vs. a right-click point) but need the same fit / flip /
 * clamp decision.
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
   * How the surface lines up with the anchor horizontally: `'start'` pins
   * left-to-left (a menu opening rightward from a click), `'end'` pins
   * right-to-right (a trigger-anchored dropdown), `'center'` lines the two
   * midpoints up (a popover under its trigger).
   *
   * `'center'` is not a third special case in the arithmetic — all three pick a
   * preferred `left` and then go through the same clamp, which is the whole
   * reason a popover can stop carrying its own positioner.
   */
  align: 'start' | 'end' | 'center';
  /**
   * Which side of the anchor the surface PREFERS. A dropdown always wants
   * `'bottom'`; `Popover` lets its caller ask for `'top'` explicitly.
   *
   * It is a preference, not a demand: whichever side is named, the surface
   * flips to the other one when the named side does not fit, and clamps when
   * neither does. So the two values are symmetric, not two different code
   * paths — which is what let `Popover` stop carrying its own positioner along
   * with its own (one-sided) clamp.
   */
  side: 'bottom' | 'top';
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
 * Vertical: sit on the `side` the caller prefers when it fits, else flip to the
 * other side, else clamp into the viewport. Horizontal: align per `align`, then
 * clamp into the viewport.
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
  const below = anchor.bottom + offset;
  const above = anchor.top - offset - size.height;

  const fitsBelow = below + size.height <= viewport.height - gutter;
  const fitsAbove = above >= gutter;

  const preferred = side === 'top' ? above : below;
  const fitsPreferred = side === 'top' ? fitsAbove : fitsBelow;
  const alternative = side === 'top' ? below : above;
  const fitsAlternative = side === 'top' ? fitsBelow : fitsAbove;

  const top = fitsPreferred
    ? preferred
    : fitsAlternative
      ? alternative
      : clamp(preferred, gutter, viewport.height - gutter - size.height);

  const preferredLeft =
    align === 'end'
      ? anchor.right - size.width
      : align === 'center'
        ? (anchor.left + anchor.right) / 2 - size.width / 2
        : anchor.left;
  const left = clamp(preferredLeft, gutter, viewport.width - gutter - size.width);

  return { top, left };
}
