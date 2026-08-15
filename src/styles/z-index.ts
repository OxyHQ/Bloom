/**
 * Stacking scale for stacking WITHIN a single context.
 *
 * ## What belongs here, and what does not
 *
 * These values order elements against their own siblings — a badge over its
 * avatar, a floating control over the panel it sits on, a sheet's drag handle
 * over the sheet body. That is a local decision with a local answer, so a
 * constant is the right tool.
 *
 * **Which OVERLAY SURFACE is on top of which is NOT on this scale**, and must
 * never be added back to it. That question is answered by open order — the
 * surface the user opened last wins — and is owned by `src/overlay/stack.ts`.
 *
 * This file used to carry rungs for that too (`dropdown` 40/41, `overlay`
 * 50/60, `tooltip` 70, `toast` 80, `fullscreen` 90/91), plus
 * `createOverlayZIndex` / `createDropdownZIndex` / `Z_INDEX_LAYER_STEP` to
 * offset them. Because a rung is fixed per COMPONENT KIND, it decided stacking
 * by what a surface WAS rather than by when it opened, so some pairings were
 * permanently inverted: a confirm dialog (50/60) opened from inside an open
 * bottom sheet (999999) rendered underneath it and could not be pressed or
 * dismissed, and a menu (40/41) opened from inside a dialog landed behind that
 * dialog. Those rungs and helpers are gone; reintroducing one reintroduces the
 * bug.
 */
export const Z_INDEX = {
  /** Default resting level. */
  base: 0,
  /** One step above an immediate sibling — a badge over its avatar. */
  raised: 1,
  /** A control floating over the content it belongs to. */
  floating: 10,
  /** A dropdown's INLINE trigger wrapper, still in the app's document flow. */
  dropdown: 40,
  /** A bottom sheet's drag handle, over the sheet's own body. */
  sheetHandle: 100,
  /**
   * The document-level portal container itself (`#bloom-portal-root`). Overlay
   * surfaces render INSIDE it and order among themselves by open order — none
   * of them may claim this value, which is what made the sheet unbeatable.
   */
  portalRoot: 999999,
} as const;

