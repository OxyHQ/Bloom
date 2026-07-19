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
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import {
  ContentPanelNestingContext,
  useContentPanelNestingGuard,
} from './nesting-context';

/** Width (in px) of the sticky gutter-mask box-shadow ring. */
export const GUTTER_MASK_SPREAD = 40;
/** Top sticky inset (px) the framed panel chrome pins to. */
export const PANEL_TOP_INSET = 8;
/** Bottom sticky inset (px) of the framed panel chrome. */
export const PANEL_BOTTOM_INSET = 8;

/**
 * Viewport width (px) at which a RESPONSIVE `ContentPanel` (`framed` undefined)
 * switches from full-bleed to framed. Each value maps to a PRE-SHIPPED literal
 * Tailwind class bundle — `768` (default) uses the named `md:`/`max-md:` screens
 * (byte-identical to prior behavior), `640` uses `sm:`/`max-sm:`, `1024` uses
 * `lg:`/`max-lg:`, and `500` uses the arbitrary `min-[500px]:`/`max-[500px]:`
 * variants (there is no named screen at 500px). The breakpoint tokens are never
 * built at runtime, so a consumer's Tailwind content-scan over `lib/**` resolves
 * them verbatim.
 */
export type ContentPanelFramedBreakpoint = 500 | 640 | 768 | 1024;

export interface ContentPanelProps {
  children: React.ReactNode;
  /**
   * Framing mode. Tri-state, resolved purely with NativeWind — no consumer
   * breakpoint hook needed:
   * - `undefined` (DEFAULT) → responsive: full-bleed below the `framedFrom`
   *   breakpoint, framed at/above it (rounded corners + sticky bleed-mask/border
   *   overlays).
   * - `false` → never framed (full-bleed at every size).
   * - `true` → always framed (rounded + overlays at every size).
   */
  framed?: boolean;
  /**
   * Viewport width at which the RESPONSIVE panel switches from full-bleed to
   * framed. Only meaningful when `framed` is `undefined` (responsive) — ignored
   * when `framed` is `true` (always framed) or `false` (never framed). Defaults
   * to `768` (Tailwind `md`), reproducing the prior fixed behavior exactly.
   */
  framedFrom?: ContentPanelFramedBreakpoint;
  /** Override the surface background utility (defaults to `bg-card`). */
  surfaceClassName?: string;
  surfaceStyle?: StyleProp<ViewStyle>;
  /** Extra utilities for the inner content wrapper. */
  contentClassName?: string;
  contentStyle?: StyleProp<ViewStyle>;
  /** Render the sticky border frame (defaults to true when framed). */
  showStickyFrame?: boolean;
  /**
   * Color of the sticky bleed-mask gutter ring. The ring is meant to match the
   * UNSCOPED outer gutter band (the app's background), so consumers that wrap
   * `<ContentPanel>` in a `BloomColorScope` (e.g. a tinted per-profile color)
   * should pass the unscoped background here — otherwise the internally-read
   * scoped `background` token would tint the ring and leave a faint corner seam.
   * Defaults to the current theme's `background` token.
   */
  maskColor?: string;
}

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
  contentClassName,
  contentStyle,
  showStickyFrame,
  maskColor,
}) => {
  // Dev-only invariant — must run unconditionally (before deriving any
  // mode-specific branch) so the hook order stays stable (rules of hooks).
  useContentPanelNestingGuard();
  const { colors } = useTheme();

  // Tri-state: `undefined` → responsive (md:-gated), `true` → always framed,
  // `false` → never framed (full-bleed).
  const responsive = framed === undefined;
  const showOverlays = framed !== false;
  // Responsive mode selects a pre-shipped literal breakpoint bundle by value;
  // `framed === true`/`false` ignore `framedFrom` (fixed always/never framing).
  const bp = RESPONSIVE_WEB[framedFrom];

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
  const surfaceClass = [surfaceBase, surfaceClassName ?? 'bg-card'].join(' ');
  const contentClass = [contentBase, contentClassName].filter(Boolean).join(' ');

  return (
    <ContentPanelNestingContext.Provider value={true}>
      <View
        {...({ className: surfaceClass } as Record<string, string>)}
        style={surfaceStyle}
      >
        {/* (1) Bleed-mask overlay — gutter box-shadow ring, below chrome. Not
            rendered when never-framed; `max-md:hidden` (display:none <md) when
            responsive, so the breakpoint is decided in CSS, not by remounting. */}
        {showOverlays && (
          <View
            key="bleed-mask"
            pointerEvents="none"
            {...({
              className: responsive
                ? `web:sticky web:top-2 z-30 h-[calc(100dvh-16px)] w-full rounded-radius-28 ${bp.overlayHidden} web:[margin-bottom:calc(-100dvh+16px)] web:[clip-path:inset(-12px)]`
                : 'web:sticky web:top-2 z-30 h-[calc(100dvh-16px)] w-full rounded-radius-28 web:[margin-bottom:calc(-100dvh+16px)] web:[clip-path:inset(-12px)]',
            } as Record<string, string>)}
            style={{ boxShadow: `0 0 0 ${GUTTER_MASK_SPREAD}px ${maskColor ?? colors.background}` }}
          />
        )}
        {/* (2) Border-frame overlay — one continuous rounded border, above all.
            Same visibility gating as the bleed-mask. */}
        {showOverlays && showStickyFrame !== false && (
          <View
            key="border-frame"
            pointerEvents="none"
            {...({
              className: responsive
                ? `web:sticky web:top-2 z-[120] h-[calc(100dvh-16px)] w-full rounded-radius-28 border border-border ${bp.overlayHidden} web:[margin-bottom:calc(-100dvh+16px)]`
                : 'web:sticky web:top-2 z-[120] h-[calc(100dvh-16px)] w-full rounded-radius-28 border border-border web:[margin-bottom:calc(-100dvh+16px)]',
            } as Record<string, string>)}
          />
        )}
        {/* Content wrapper — STABLE position + key so toggling `framed` reconciles
            in place instead of remounting `{children}` (which would reset feed
            scroll/virtualizer + refetch on a breakpoint cross). Clipped to the
            rounded panel shape on web when framed. */}
        <View
          key="content"
          {...({ className: contentClass } as Record<string, string>)}
          style={contentStyle}
        >
          {children}
        </View>
      </View>
    </ContentPanelNestingContext.Provider>
  );
};

export const ContentPanel = memo(ContentPanelComponent);
ContentPanel.displayName = 'ContentPanel';
