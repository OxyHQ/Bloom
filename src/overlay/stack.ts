/**
 * The overlay stacking authority.
 *
 * ## The rule
 *
 * An overlay opened LATER paints above one opened earlier. That is the whole
 * contract, and it is decided here, once, for every Bloom overlay surface —
 * never by a per-component constant.
 *
 * ## Why this module exists
 *
 * Stacking used to be a set of hand-picked rungs on a shared scale: menus at
 * 40, dialogs at 50/60, tooltips at 70, sheets at 999999. Because those numbers
 * are fixed per COMPONENT KIND, the answer to "which surface is on top" was
 * decided by what each surface WAS rather than by when the user opened it — so
 * some pairings were permanently inverted no matter the order:
 *
 *   - A confirm dialog (50/60) opened from inside an open bottom sheet (999999)
 *     rendered fully, interactively, and completely underneath the sheet. It
 *     could be neither pressed nor dismissed.
 *   - A menu (40/41) opened from inside a dialog (50/60) landed behind the very
 *     dialog that launched it.
 *
 * Both failed silently: correct markup, correct styles, nothing in the console.
 * Only a hit test in a real browser tells the difference, which is why
 * `scripts/verify-overlay-stacking.mjs` exists alongside the unit tests here.
 *
 * ## How a rank is acquired
 *
 * `useOverlayLayer()` takes a rank on MOUNT and releases it on unmount, so the
 * caller must be a component that mounts when the surface OPENS — which is how
 * every Bloom surface is already built (`Dialog.web` returns null while closed;
 * `BottomSheetBase` returns null until `rendered`). Acquiring per mount, in a
 * `useState` initializer, is what makes the rank correct on the surface's FIRST
 * paint: an effect-assigned z would leave one frame at the wrong depth, which
 * on a 200ms fade-in is a visible flash of the surface behind its neighbour.
 *
 * It also keeps the acquisition out of any position the React Compiler may
 * memoize. A counter read during render is exactly the external-mutable-state
 * hazard the compiler mangles; a state initializer is not memoizable that way.
 * (React StrictMode double-invokes initializers in development, so a rank can
 * be consumed and dropped. That is harmless: only the ORDER of the numbers
 * matters, never their density.)
 *
 * ## Toasts are deliberately not in this stack
 *
 * A toast is a notification, not a modal surface: it must stay visible over
 * whatever is open, including a surface opened after it. It is pinned above the
 * whole stack at `TOAST_LAYER_Z` instead of taking a rank. (Under the old
 * scale a toast at 80 was already lost behind any open bottom sheet at 999999.)
 */

/**
 * First z-index handed to an overlay. Comfortably above app content while
 * staying far below `TOAST_LAYER_Z`.
 */
export const OVERLAY_STACK_BASE = 1000;

/**
 * Z-index distance between consecutive overlays. A surface owns its whole band,
 * so it can order its own parts (backdrop, panel, a floating control) without
 * ever reaching the next surface's floor.
 */
export const OVERLAY_STACK_BAND = 10;

/**
 * Ceiling on simultaneously open overlays. Beyond this, ranks saturate and the
 * topmost surfaces tie (falling back to DOM order) rather than climbing into
 * the toast layer. Nothing in the ecosystem stacks remotely this deep; the
 * clamp exists so a runaway caller degrades instead of breaking the toast
 * layer's guarantee.
 */
export const OVERLAY_STACK_MAX_RANK = 500;

/**
 * The toast layer, pinned above every overlay rank (see the note above on why
 * toasts are not part of the stack).
 */
export const TOAST_LAYER_Z =
  OVERLAY_STACK_BASE + OVERLAY_STACK_BAND * (OVERLAY_STACK_MAX_RANK + 1);

/** The z-indices one overlay surface may use, all within its own band. */
export interface OverlayLayer {
  /** The surface's outermost node — everything it renders is inside this. */
  root: number;
  /** Its dimming layer. */
  backdrop: number;
  /** Its panel, above its own backdrop. */
  surface: number;
}

/**
 * Registry state.
 *
 * `sequence` only ever moves forward while anything is open, which is what
 * guarantees the ordering. It resets once the last overlay closes so the
 * numbers stay small over a long session.
 */
interface Registry {
  sequence: number;
  live: Set<number>;
}

declare global {
  // eslint-disable-next-line no-var
  var __oxyhq_bloom_overlay_stack__: Registry | undefined;
}

/**
 * `globalThis`-anchored, for the same reason as the portal group and the theme
 * context: `exports` ships a `react-native` → `src` condition beside the
 * `lib/module` and `lib/commonjs` forks, and overlay surfaces are imported
 * cross-subpath (`./dialog`, `./bottom-sheet`, `./menu`, `./select`, …). A
 * bundler can resolve those through different conditions, and two physical
 * copies of this module would each run their own counter — handing out
 * colliding ranks and reintroducing exactly the bug this module removes.
 */
function registry(): Registry {
  globalThis.__oxyhq_bloom_overlay_stack__ ??= { sequence: 0, live: new Set() };
  return globalThis.__oxyhq_bloom_overlay_stack__;
}

/** Z-indices for a given rank. Exported for tests and for the native surfaces. */
export function layerForRank(rank: number): OverlayLayer {
  const clamped = Math.min(Math.max(rank, 1), OVERLAY_STACK_MAX_RANK);
  const root = OVERLAY_STACK_BASE + OVERLAY_STACK_BAND * clamped;
  return { root, backdrop: root, surface: root + 1 };
}

/**
 * Take the next rank. Exported for tests; components use `useOverlayLayer`.
 */
export function acquireOverlayRank(): number {
  const reg = registry();
  reg.sequence += 1;
  return reg.sequence;
}

/**
 * Mark a rank as live. Called from an effect, which React balances against
 * `releaseOverlayRank` even under StrictMode's mount/unmount/remount.
 *
 * It also re-floors `sequence` to at least this rank. That closes the only race
 * the reset below could otherwise open: a surface takes rank N during render,
 * and before its effect runs, the last previously-open surface unmounts and
 * resets the counter to 0 — the next surface would then take rank 1 and sit
 * BELOW the one still coming up at N. Re-flooring on register makes the reset
 * unable to lose a rank that has been handed out.
 */
export function registerOverlayRank(rank: number): void {
  const reg = registry();
  reg.live.add(rank);
  if (rank > reg.sequence) reg.sequence = rank;
}

/** Release a rank; resets the counter once nothing is open. */
export function releaseOverlayRank(rank: number): void {
  const reg = registry();
  reg.live.delete(rank);
  if (reg.live.size === 0) reg.sequence = 0;
}

/** Test seam — drops all registry state. */
export function resetOverlayStack(): void {
  globalThis.__oxyhq_bloom_overlay_stack__ = { sequence: 0, live: new Set() };
}
