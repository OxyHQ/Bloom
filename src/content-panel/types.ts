import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

/**
 * Viewport width (px) at which a RESPONSIVE `ContentPanel` (`framed` undefined)
 * switches from full-bleed to framed. Each value maps to a PRE-SHIPPED literal
 * Tailwind class bundle — `768` (default) uses the named `md:` screen
 * (byte-identical to prior behavior), `640` uses `sm:`, `1024` uses `lg:`, and
 * `500` uses the arbitrary `min-[500px]:` variant (there is no named screen at
 * 500px). The breakpoint tokens are never built at runtime, so a consumer's
 * Tailwind content-scan over `src/**`/`lib/**` resolves them verbatim.
 */
export type ContentPanelFramedBreakpoint = 500 | 640 | 768 | 1024;

/** How a framed `ContentPanel` draws its edge. */
export type ContentPanelChrome = 'elevated' | 'border' | 'none';

export interface ContentPanelProps {
  children: React.ReactNode;
  /**
   * Framing mode. Tri-state, resolved purely with NativeWind — no consumer
   * breakpoint hook needed:
   * - `undefined` (DEFAULT) → responsive: full-bleed below the `framedFrom`
   *   breakpoint, rounded + bordered at/above it.
   * - `false` → never framed (plain full-bleed at every size).
   * - `true` → always rounded + bordered.
   */
  framed?: boolean;
  /**
   * Viewport width at which the RESPONSIVE panel switches from full-bleed to
   * framed. Only meaningful when `framed` is `undefined` (responsive) — ignored
   * when `framed` is `true` (always framed) or `false` (never framed). Defaults
   * to `768` (Tailwind `md`), reproducing the prior fixed behavior exactly.
   */
  framedFrom?: ContentPanelFramedBreakpoint;
  /**
   * The panel's EDGE, when it is framed.
   *
   * - `'elevated'` (DEFAULT) — the hairline plus the floating-panel shadow the
   *   `Sidebar` wears (`styles/panel-chrome.ts`), so the panel reads as a
   *   surface lifted off the page rather than a box drawn on it.
   * - `'border'` — the hairline alone, which is what this panel drew before.
   * - `'none'` — no edge at all: a flat surface that still clips and rounds,
   *   for an app whose page background already separates the two.
   *
   * Ignored while the panel is full-bleed (below `framedFrom`, or
   * `framed={false}`) — there is no edge to draw.
   */
  chrome?: ContentPanelChrome;
  /**
   * Overrides the shadow `chrome="elevated"` draws (any `box-shadow` string).
   * For an app that wants its own elevation without giving up the hairline.
   */
  shadow?: string;
  /** Override the surface background utility (defaults to `bg-card`). */
  surfaceClassName?: string;
  surfaceStyle?: StyleProp<ViewStyle>;
  /** Extra utilities for the inner content wrapper. */
  contentClassName?: string;
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Whether to render the WEB sticky border frame. No-op on native (the border
   * is always part of the surface).
   */
  showStickyFrame?: boolean;
  /**
   * Color of the WEB sticky bleed-mask gutter ring. Accepted for cross-platform
   * API parity — no-op on native (there is no bleed-mask), like `framed`.
   */
  maskColor?: string;
  /**
   * How the WEB overlays (bleed-mask, border-frame) size themselves. No-op on
   * native (there are no overlays to size).
   * - `'viewport'` (DEFAULT) — sized to the dynamic viewport height (`100dvh`)
   *   and `position: sticky`-pinned, so they read as a constant frame around
   *   the visible slice of a panel whose own DOM height can exceed one screen
   *   — the document-scroll case (e.g. a feed whose page grows with content).
   *   Requires the panel to sit in a document that actually scrolls; see
   *   `ContentPanel.web.tsx`'s doc comment.
   * - `'panel'` — sized to the panel's own real box via CSS Grid layer-
   *   stacking (the overlays and the content wrapper all occupy the same
   *   grid cell) instead of viewport math. The right mode for a consumer
   *   whose own shell already bounds the panel's height (no document
   *   scroll — a fixed app shell with its own internal scroll containers),
   *   where anything the consumer places outside the panel (e.g. a header
   *   above it) must never be overlapped by an overlay sized to the whole
   *   viewport.
   */
  /**
   * DEFAULT `'panel'`. The edge describes the panel's OWN box, so it scrolls
   * with the content like any other border: on a page taller than the screen
   * you see the two side edges while scrolling and the rounded corners at the
   * ends, which is what a long framed column looks like.
   *
   * `'viewport'` is the older behaviour: the frame is a screen-tall sticky
   * rectangle, so a rounded top and bottom edge follow the viewport down the
   * page. It reads as the panel breathing — the frame holds still while the
   * content moves inside it, and it jumps 8px on the first scroll — which is
   * why it is no longer the default. It remains for a consumer that wants that
   * constant frame.
   */
  overlaySizing?: 'viewport' | 'panel';
  /**
   * Pixels of REAL, persistent chrome the consumer has placed above the panel
   * — outside it, in normal document flow — that the viewport-mode overlays
   * (`overlaySizing="viewport"`, the default) do not otherwise know about.
   * No-op when `overlaySizing="panel"` (that mode already starts at the
   * panel's own box, wherever that is) and on native (no overlays there).
   *
   * The overlays are sized/positioned off the VIEWPORT (`top: 8px`,
   * `height: calc(100dvh - 16px)`) on the assumption that the panel begins
   * near the true top of the screen. A consumer with its own sticky chrome
   * above the panel (a header, say, kept sticky-pinned the same way) shifts
   * where the panel visually starts without moving the panel's own DOM
   * position, so the overlays would still read from viewport 0 and paint
   * over that chrome. This shifts their `top` down and shrinks their height
   * by the same amount, so they begin exactly where the panel visually does.
   */
  overlayTopOffset?: number;
}
