/**
 * How far a floating surface sits from a window edge.
 *
 * ## The rule this file encodes
 *
 * A floating surface CLEARS THE OS'S RESERVED BAND IN FULL. The safe-area inset
 * is the space the platform has reserved for its own affordance — the iOS home
 * indicator, the Android gesture handle — and a surface that sits inside it is
 * sitting on top of a system control.
 *
 * Bloom used to answer this question three times, differently:
 *
 *   - a detached `BottomSheet`  `insets.bottom + 16`
 *   - the toast stack           `bottom > 0 ? bottom + 8 : 16`
 *   - the floating tab bar      `max(bottom - 16, 12)`
 *
 * The tab bar was the only one that SUBTRACTED, and subtracting is what put it
 * on the Android gesture handle: a gesture-navigation device reserves ~24dp, the
 * bar absorbed 16 of it, hit its own 12dp floor, and landed inside the band with
 * the handle drawn through it. The other two were never reachable by that bug
 * because they add.
 *
 * One function now answers it for all three, and the additive `gap` reproduces
 * the sheet and the toast exactly — only the tab bar moves.
 */

/**
 * Breathing room from a window edge where the platform reserves nothing at all
 * (web, a browser with no visual viewport inset, an Android device with the
 * gesture bar hidden).
 *
 * It is also the FLOOR for every surface: a small-but-nonzero inset must never
 * pull a surface closer to the edge than a device reporting no inset would.
 */
export const EDGE_GAP = 16;

/**
 * The distance a floating surface holds off a window edge, given that edge's
 * safe-area inset.
 *
 * `gap` is the surface's own breathing room ON TOP of the reserved band, not an
 * allowance to spend inside it — a bigger `gap` floats the surface further from
 * the affordance, never closer. Pass `0` for a surface that should hug the safe
 * area (the tab bar), a positive number for one that should stand clear of it (a
 * detached sheet, a toast stack).
 *
 * ```ts
 * windowEdgeGap(insets.bottom)      // 34pt iOS · 24dp Android · 16 web
 * windowEdgeGap(insets.bottom, 16)  // 50pt iOS · 40dp Android · 16 web
 * ```
 *
 * Anything laying out AROUND such a surface wants its total footprint (this gap
 * plus the surface's own height) and must get it from the surface — never by
 * adding `insets.bottom` to a hardcoded height, which double-counts the inset
 * because the inset is already folded in here.
 */
export function windowEdgeGap(inset: number, gap = 0): number {
  return Math.max(inset + gap, EDGE_GAP);
}
