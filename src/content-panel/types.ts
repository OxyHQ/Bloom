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
  /**
   * The panel is the HEIGHT OF THE SPACE IT IS GIVEN, and its content scrolls
   * inside it — instead of the panel growing with its content while the page
   * scrolls underneath.
   *
   * This is what makes a framed column read as a panel: it reaches the bottom
   * of the screen and closes there, the way the rail beside it does. Without
   * it, a feed taller than the window gives a panel whose top edge you see and
   * whose bottom edge is somewhere past the fold — an open-ended column, not a
   * surface.
   *
   * It needs a parent that BOUNDS it (a flex column with a real height): an
   * `AppShell` with `scroll="fixed"` or `scroll="container"`, or any screen
   * that is `flex: 1`. In a document-scrolled page there is no height to fill
   * and the panel keeps growing with its content — that page wants
   * `scroll="document"`, not this prop.
   *
   * On web the content wrapper becomes the scroller. On native the panel and
   * its content are already `flex: 1`, so a `FlatList`/`ScrollView` inside
   * fills the panel and scrolls within it.
   */
  fill?: boolean;
  /** Override the surface background utility (defaults to `bg-card`). */
  surfaceClassName?: string;
  surfaceStyle?: StyleProp<ViewStyle>;
  /**
   * The colour this panel paints, when `surfaceClassName`/`surfaceStyle` has
   * repainted it.
   *
   * The panel PUBLISHES its fill to everything inside it — `useSurfaceFill()`
   * and, on web, `var(--bloom-surface)` — so in-panel chrome that has to be
   * opaque in the panel's own colour (a sticky header, a tab rail, a reply bar)
   * can ask instead of repeating a class. By default that colour is
   * `theme.colors.card`, which is what the panel paints.
   *
   * A `surfaceClassName` override is a utility Bloom cannot resolve to a colour,
   * so the panel stops claiming to know one rather than publishing a wrong
   * answer — this prop is how the override says what it painted, and it is
   * needed only then. A `surfaceStyle` carrying a `backgroundColor` is the same
   * repaint by the other door and stops the claim the same way: the colour is
   * legible there, but which of the class and the style actually paints differs
   * by platform, so the panel refuses to guess. It changes nothing about how the
   * panel LOOKS: the class or the style still paints the surface.
   */
  surfaceColor?: string;
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
   * How the WEB overlays (the bleed-mask and the border frame) size themselves.
   * No-op on native (there are no overlays to size).
   *
   * - `'viewport'` (DEFAULT) — the frame is a SCREEN-TALL sticky rectangle:
   *   `100dvh` minus the insets, pinned at `overlayInset`. The panel's own box
   *   grows with its content and the document scrolls it, while the edge stays
   *   where the screen is — so the panel reads as a surface that occupies the
   *   window from top to bottom and the content moves inside it. This is the
   *   mode for a page that scrolls the document.
   * - `'panel'` — the overlays are the panel's OWN box, through CSS Grid
   *   layer-stacking (the overlays and the content wrapper share one grid
   *   cell). The right mode when the panel's box already IS the visible area
   *   (`fill`, inside a shell that bounds it) or when something the consumer
   *   placed outside the panel — a header above it — must never be painted
   *   over by an overlay sized to the whole viewport.
   */
  overlaySizing?: 'viewport' | 'panel';
  /**
   * The gap between the VIEWPORT's edge and the sticky frame, in `'viewport'`
   * mode. Default 8.
   *
   * **It must equal the distance from the top of the screen to the panel's own
   * top edge.** Sticky positioning leaves an element at its static position
   * until scrolling would push it past the inset — so a panel that starts 16px
   * down the page with an 8px inset draws its frame at 16, then SNAPS it to 8
   * on the first scroll. That 8px jump is the whole bug, and it reads as the
   * panel breathing. A shell passes its own gutter here.
   *
   * Takes a pair when the top and the bottom differ — persistent chrome above
   * the panel (a sticky header the consumer keeps outside it) shifts where the
   * panel visually starts without moving its DOM position, so the frame has to
   * start lower without also ending higher.
   */
  overlayInset?: number | { top: number; bottom: number };
}
