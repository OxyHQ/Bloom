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
 * When `framed` is false (narrow screens) the panel is full-bleed: a single
 * flat surface, no rounding, no overlays.
 *
 * Native bundlers use `./index.tsx` (a plain rounded surface); web bundlers
 * select this file via the `"browser"` export condition in `package.json`.
 *
 * Styling is NativeWind-className-first; the literal class strings below MUST
 * stay literal so a consumer's Tailwind content-scan over `lib/**` picks them up
 * (no dynamic concatenation of the arbitrary `web:[…]` / `rounded-radius-28`
 * parts).
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

export interface ContentPanelProps {
  children: React.ReactNode;
  /** Framed (wide screens) vs full-bleed (narrow screens). */
  framed: boolean;
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

const ContentPanelComponent: React.FC<ContentPanelProps> = ({
  children,
  framed,
  surfaceClassName,
  surfaceStyle,
  contentClassName,
  contentStyle,
  showStickyFrame,
  maskColor,
}) => {
  // Dev-only invariant — must run unconditionally before the early `!framed`
  // return so the hook order stays stable across renders (rules of hooks).
  useContentPanelNestingGuard();
  const { colors } = useTheme();

  const surfaceClass = framed
    ? ['flex-1 rounded-radius-28', surfaceClassName ?? 'bg-card'].join(' ')
    : ['flex-1', surfaceClassName ?? 'bg-card'].join(' ');
  const contentClass = framed
    ? ['flex-1 rounded-radius-28 web:overflow-x-clip', contentClassName].filter(Boolean).join(' ')
    : ['flex-1', contentClassName].filter(Boolean).join(' ');

  return (
    <ContentPanelNestingContext.Provider value={true}>
      <View
        {...({ className: surfaceClass } as Record<string, string>)}
        style={surfaceStyle}
      >
        {/* (1) Bleed-mask overlay — gutter box-shadow ring, below chrome. Framed only. */}
        {framed && (
          <View
            key="bleed-mask"
            pointerEvents="none"
            {...({
              className:
                'web:sticky web:top-2 z-30 h-[calc(100dvh-16px)] w-full rounded-radius-28 web:[margin-bottom:calc(-100dvh+16px)] web:[clip-path:inset(-12px)]',
            } as Record<string, string>)}
            style={{ boxShadow: `0 0 0 ${GUTTER_MASK_SPREAD}px ${maskColor ?? colors.background}` }}
          />
        )}
        {/* (2) Border-frame overlay — one continuous rounded border, above all. Framed only. */}
        {framed && showStickyFrame !== false && (
          <View
            key="border-frame"
            pointerEvents="none"
            {...({
              className:
                'web:sticky web:top-2 z-[120] h-[calc(100dvh-16px)] w-full rounded-radius-28 border border-border web:[margin-bottom:calc(-100dvh+16px)]',
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
