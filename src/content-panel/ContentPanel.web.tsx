/**
 * Web variant of `ContentPanel` — the framed app-content surface.
 *
 * On the web, app content scrolls the DOCUMENT, and a multi-column shell keeps
 * the routed content in a rounded, bordered center panel. Two problems follow
 * from letting feed content bleed to the rounded panel edge, both solved here
 * with sticky, full-viewport-height overlays inside the panel surface:
 *
 *  1. BLEED-MASK overlay (`z-30`): a `box-shadow` ring in the GUTTER color
 *     (Bloom `background` token) drawn OVER content that bleeds into the thin
 *     lateral gutter / rounded corners. `clip-path: inset(-12px)` keeps that
 *     ring off the side columns. It sits below opaque chrome (headers/banners),
 *     so it only masks the content's bleed, never the chrome. No border.
 *     (`clip-path` MUST be the arbitrary class — RN-web drops it from `style`.)
 *
 *  2. BORDER-FRAME overlay (`z-[120]`): a single 1px rounded `border-border`
 *     outline with a transparent interior, ABOVE all content. Being one element
 *     above everything, it draws ONE continuous rounded border around all four
 *     sides — no seams, no double lines, no per-chrome borders.
 *
 * Both overlays are `position: sticky; top: 8px` with a negative
 * `margin-bottom` so they occupy zero layout height (they overlay the scrolled
 * content rather than displacing it). They render BEFORE the content wrapper so
 * z-index — not DOM order — decides layering.
 *
 * That sticky/`100dvh` sizing is itself a CHOICE, not the only mode — see
 * `overlaySizing`. It is correct exactly when the panel's own DOM height can
 * exceed one viewport in a document that actually scrolls (dvh gives the
 * overlay a fixed, viewport-sized height that a percentage cannot: percentage
 * heights need a definite ancestor height, which an auto-height document-flow
 * ancestor never has). A consumer whose OWN shell already bounds the panel's
 * height (no document scroll) doesn't have that problem, and viewport-sizing
 * there is actively wrong — the overlay reads `100dvh` regardless of how much
 * of the viewport is actually the panel's, so anything the consumer placed
 * outside the panel (a header above it, say) gets painted over.
 * `overlaySizing="panel"` is that second mode: CSS Grid layer-stacking (every
 * child placed in the same `grid-area: 1/1`) instead of sticky/dvh/negative-
 * margin — each child fills exactly the grid cell, i.e. exactly the panel's
 * own box, whatever that box's real height is. No `position: absolute` (that
 * takes the content wrapper out of flow, which is not what "panel" mode
 * changes — only the two overlays' sizing mechanism changes) and no percentage
 * margin (the well-known CSS quirk where a vertical margin percentage resolves
 * against the containing block's WIDTH, not its height, so it cannot express
 * "100% of my own height" at all).
 *
 * The bleed-mask's `clip-path` also changes with the mode, not just its box
 * size: `inset(-12px)` (viewport mode) is a deliberate small halo — the
 * `box-shadow`'s `GUTTER_MASK_SPREAD` is 40px, and the clip-path caps how much
 * of that is actually allowed to paint past the box edge. A document-scroll
 * consumer has nothing else positioned right above/below the panel for that
 * halo to land on. A bounded-shell consumer might — the whole reason for
 * `overlaySizing="panel"` is that something IS placed right outside the panel
 * — so panel mode clips the shadow flush to the box (`inset(0)`, zero bleed)
 * rather than merely resizing the box and leaving a smaller bleed that could
 * still reach a close sibling.
 *
 * Framing is tri-state via the `framed` prop:
 *
 *  - `undefined` (DEFAULT) → RESPONSIVE, driven purely by NativeWind: full-bleed
 *    below the `framedFrom` breakpoint, framed at/above it. The breakpoint is
 *    configurable per consumer (`framedFrom`, default `768` / Tailwind `md`); the
 *    rounding is gated by that breakpoint's `min-*:` variant and both overlays
 *    are always rendered but carry the matching `max-*:hidden` literal
 *    (`display:none` below the breakpoint), so the breakpoint is decided entirely
 *    in CSS — no consumer JS breakpoint hook.
 *  - `false` → NEVER framed (full-bleed at every size): a single flat surface,
 *    no rounding, no overlays.
 *  - `true` → ALWAYS framed (rounded + overlays at every size).
 *
 * The overlays are gated by VISIBILITY (a `max-*:hidden` literal for the chosen
 * breakpoint) rather than by conditional mounting for the responsive case, so
 * crossing the breakpoint never remounts them. The content wrapper likewise
 * keeps a stable `key` so `{children}` reconciles in place across the breakpoint
 * instead of remounting (which would reset feed scroll / the virtualizer +
 * refetch).
 *
 * Native bundlers use `./index.tsx` (a plain rounded surface); web bundlers
 * select this file via the `"browser"` export condition in `package.json`.
 *
 * Styling is NativeWind-className-first; the literal class strings below MUST
 * stay literal so a consumer's Tailwind content-scan over `lib/**` picks them up
 * (no dynamic concatenation of the arbitrary `web:[…]` / `rounded-radius-28` /
 * `md:` parts — whole class strings are selected per mode instead).
 */
import React, { memo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { StyledView } from '../styles/styled-primitives';

import { useOptionalPanelChrome } from '../styles/panel-chrome';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import {
  ContentPanelNestingContext,
  useContentPanelNestingGuard,
} from './context';
import { usePanelSurfaceFill } from './shared';
import type { ContentPanelFramedBreakpoint, ContentPanelProps } from './types';

/** Width (in px) of the sticky gutter-mask box-shadow ring. */
export const GUTTER_MASK_SPREAD = 40;
/** Top sticky inset (px) the framed panel chrome pins to. */
export const PANEL_TOP_INSET = 8;
/** Bottom sticky inset (px) of the framed panel chrome. */
export const PANEL_BOTTOM_INSET = 8;

/**
 * Per-breakpoint literal Tailwind variant tokens for the WEB responsive mode.
 * Each field is a WHOLE literal class string (never assembled from parts at
 * runtime) so the consumer's content-scan over `lib/**` picks up every
 * arbitrary/`min-*`/`max-*`/`web:` token verbatim. Selecting a bundle by
 * `framedFrom` value is the only runtime decision:
 * - `surface`       → framing rounding on the surface at/above the breakpoint.
 * - `content`       → the same rounding + a web-only horizontal clip on the
 *   inner content wrapper (`web:<bp>:overflow-x-clip`, platform-first-then-
 *   breakpoint — matching the consumer convention `web:sm:flex` in `@mercaria/ui`).
 * - `overlayHidden` → `display:none` for the sticky overlays BELOW the breakpoint.
 *   `min-[500px]:` (≥500) and `max-[500px]:` (<500) are exactly complementary
 *   (meet at 500, no overlap/gap), mirroring the named `md:`/`max-md:` pair.
 */
const RESPONSIVE_WEB: Record<
  ContentPanelFramedBreakpoint,
  { surface: string; content: string; overlayHidden: string }
> = {
  500: {
    surface: 'min-[500px]:rounded-radius-28',
    content: 'min-[500px]:rounded-radius-28 web:min-[500px]:overflow-x-clip',
    overlayHidden: 'max-[500px]:hidden',
  },
  640: {
    surface: 'sm:rounded-radius-28',
    content: 'sm:rounded-radius-28 web:sm:overflow-x-clip',
    overlayHidden: 'max-sm:hidden',
  },
  768: {
    surface: 'md:rounded-radius-28',
    content: 'md:rounded-radius-28 web:md:overflow-x-clip',
    overlayHidden: 'max-md:hidden',
  },
  1024: {
    surface: 'lg:rounded-radius-28',
    content: 'lg:rounded-radius-28 web:lg:overflow-x-clip',
    overlayHidden: 'max-lg:hidden',
  },
};

const ContentPanelComponent: React.FC<ContentPanelProps> = ({
  children,
  framed,
  framedFrom = 768,
  surfaceClassName,
  surfaceStyle,
  surfaceColor,
  contentClassName,
  contentStyle,
  showStickyFrame,
  chrome = 'elevated',
  shadow,
  maskColor,
  overlaySizing = 'viewport',
  overlayTopOffset,
}) => {
  // Dev-only invariant — must run unconditionally (before deriving any
  // mode-specific branch) so the hook order stays stable (rules of hooks).
  useContentPanelNestingGuard();
  const { colors } = useTheme();
  // The floating-panel edge the `Sidebar` wears. Optional: the panel drew its
  // own surface long before it had a shadow, so it must not start throwing
  // outside a provider.
  const panelChrome = useOptionalPanelChrome();
  // What the panel tells its subtree it is painted in (`./shared.ts`).
  const publishedFill = usePanelSurfaceFill(surfaceClassName, surfaceStyle, surfaceColor);

  // Tri-state: `undefined` → responsive (md:-gated), `true` → always framed,
  // `false` → never framed (full-bleed).
  const responsive = framed === undefined;
  const showOverlays = framed !== false;
  // Responsive mode selects a pre-shipped literal breakpoint bundle by value;
  // `framed === true`/`false` ignore `framedFrom` (fixed always/never framing).
  const bp = RESPONSIVE_WEB[framedFrom];
  const boundToPanel = overlaySizing === 'panel';

  // Whole literal class strings selected per mode (the Tailwind content-scan
  // over `lib/**` requires each arbitrary/`min-*`/`max-*`/`web:` token stay
  // literal — the breakpoint tokens live whole in `RESPONSIVE_WEB` above and are
  // only spliced in, never assembled from parts).
  const surfaceBase = responsive
    ? `flex-1 ${bp.surface}`
    : framed
      ? 'flex-1 rounded-radius-28'
      : 'flex-1';
  const contentBase = responsive
    ? `flex-1 ${bp.content}`
    : framed
      ? 'flex-1 rounded-radius-28 web:overflow-x-clip'
      : 'flex-1';
  // `overlaySizing="panel"`: the surface becomes a single-cell CSS Grid so the
  // overlays and the content wrapper below can all be placed in that ONE cell
  // (`web:[grid-area:1/1]`) and each fill it exactly — `minmax(0,1fr)` (not
  // `1fr` alone) on both axes so the track can still SHRINK below its content's
  // intrinsic size, the grid-track equivalent of the flex `min-height: 0`
  // fix — without it, a tall scrollable child would grow the row instead of
  // being clipped/scrolled inside a fixed-height cell.
  const gridStackClass = boundToPanel
    ? 'web:grid web:[grid-template-columns:minmax(0,1fr)] web:[grid-template-rows:minmax(0,1fr)]'
    : '';
  const surfaceClass = [surfaceBase, gridStackClass, surfaceClassName ?? 'bg-card'].filter(Boolean).join(' ');
  const contentClass = [contentBase, boundToPanel ? 'web:[grid-area:1/1]' : '', contentClassName]
    .filter(Boolean)
    .join(' ');

  // `overlayTopOffset`: the viewport-mode overlays are sized/positioned from
  // literal Tailwind classes (`top-2`, `h-[calc(100dvh-16px)]`, a matching
  // negative `margin-bottom`) because those values are constants known at
  // build time. An offset is a runtime number (a consumer's measured header
  // height), which a Tailwind arbitrary class can't express — content-scanning
  // needs the literal class string in source, not a value computed later — so
  // this shifts the same three properties via inline `style` instead, which
  // has no such constraint. No-op in `panel` mode (already starts at the
  // panel's own box) and when unset (0/undefined) — the className values are
  // left standing on their own in both of those cases.
  // RN's `ViewStyle.height`/`marginBottom` types only accept a number or a
  // `${number}%` string (not an arbitrary CSS `calc()` string), because most
  // of this type is shared with native, where `calc()` doesn't exist. This
  // file is web-only, where it's a real, valid CSS value react-native-web
  // passes straight through — the same reasoning `WebViewStyle`/`asViewStyle`
  // document in OxyHQ/Mention's `types/webStyles.ts` for the identical need.
  const topOffsetStyle = !boundToPanel && overlayTopOffset
    ? ({
        top: 8 + overlayTopOffset,
        height: `calc(100dvh - ${16 + overlayTopOffset}px)`,
        marginBottom: `calc(-100dvh + ${16 + overlayTopOffset}px)`,
      } as unknown as ViewStyle)
    : undefined;

  return (
    <ContentPanelNestingContext.Provider value={true}>
      <StyledView
        testID="content-panel-surface"
        className={surfaceClass}
        style={[
          // `--bloom-surface` rides the element that carries the fill, so CSS
          // below the panel and `useSurfaceFill()` below the panel cannot
          // disagree about what the panel painted.
          surfaceFillVars(publishedFill),
          surfaceStyle,
        ]}
      >
        {/* (1) Bleed-mask overlay — gutter box-shadow ring, below chrome. Not
            rendered when never-framed; `max-md:hidden` (display:none <md) when
            responsive, so the breakpoint is decided in CSS, not by remounting. */}
        {showOverlays && (
          <StyledView
            key="bleed-mask"
            testID="content-panel-bleed-mask"
            pointerEvents="none"
            className={
              boundToPanel
                ? `web:[grid-area:1/1] z-30 h-full w-full rounded-radius-28 ${responsive ? bp.overlayHidden : ''} web:[clip-path:inset(0)]`
                : responsive
                  ? `web:sticky web:top-2 z-30 h-[calc(100dvh-16px)] w-full rounded-radius-28 ${bp.overlayHidden} web:[margin-bottom:calc(-100dvh+16px)] web:[clip-path:inset(-12px)]`
                  : 'web:sticky web:top-2 z-30 h-[calc(100dvh-16px)] w-full rounded-radius-28 web:[margin-bottom:calc(-100dvh+16px)] web:[clip-path:inset(-12px)]'
            }
            style={{ ...topOffsetStyle, boxShadow: `0 0 0 ${GUTTER_MASK_SPREAD}px ${maskColor ?? colors.background}` }}
          />
        )}
        {/* (2) Border-frame overlay — one continuous rounded border, above all.
            Same visibility gating as the bleed-mask. */}
        {showOverlays && showStickyFrame !== false && chrome !== 'none' && (
          <StyledView
            key="border-frame"
            testID="content-panel-border-frame"
            pointerEvents="none"
            // The shadow rides the SAME element as the hairline, so the lift and
            // the edge can never disagree about where the panel ends. It paints
            // outward, into the gutter the page background shows.
            style={[topOffsetStyle, chrome === 'elevated' && (shadow || panelChrome)
                ? { boxShadow: shadow ?? panelChrome?.shadow }
                : null]}
            className={
              boundToPanel
                ? `web:[grid-area:1/1] z-[120] h-full w-full rounded-radius-28 border border-border ${responsive ? bp.overlayHidden : ''}`
                : responsive
                  ? `web:sticky web:top-2 z-[120] h-[calc(100dvh-16px)] w-full rounded-radius-28 border border-border ${bp.overlayHidden} web:[margin-bottom:calc(-100dvh+16px)]`
                  : 'web:sticky web:top-2 z-[120] h-[calc(100dvh-16px)] w-full rounded-radius-28 border border-border web:[margin-bottom:calc(-100dvh+16px)]'
            }
          />
        )}
        {/* Content wrapper — STABLE position + key so toggling `framed` reconciles
            in place instead of remounting `{children}` (which would reset feed
            scroll/virtualizer + refetch on a breakpoint cross). Clipped to the
            rounded panel shape on web when framed. */}
        <StyledView key="content" testID="content-panel-content" className={contentClass} style={contentStyle}>
          {/* The panel is a surface: everything inside is sitting on rung 1,
              painted in the colour this panel actually paints. */}
          <SurfaceLevelProvider level={1} fill={publishedFill}>
            {children}
          </SurfaceLevelProvider>
        </StyledView>
      </StyledView>
    </ContentPanelNestingContext.Provider>
  );
};

export const ContentPanel = memo(ContentPanelComponent);
ContentPanel.displayName = 'ContentPanel';
