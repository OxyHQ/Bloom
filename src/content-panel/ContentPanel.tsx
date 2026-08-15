/**
 * Native variant of `ContentPanel` — the framed app-content surface.
 *
 * `ContentPanel` is the rounded, bordered panel that holds an app's routed
 * content. On WEB it adds two sticky overlays (a gutter "bleed-mask" box-shadow
 * ring and a continuous rounded border frame) so feed content that bleeds into
 * the rounded corners / lateral gutters is masked while a single seamless border
 * is drawn around the panel — see `index.web.tsx`.
 *
 * On NATIVE none of the WEB overlay machinery applies: there is no document
 * scroll, no sticky positioning, and no bleed to mask, so the panel is simply a
 * surface wrapping its content. The `framed` prop still drives whether that
 * surface is rounded + bordered, tri-state and resolved with pure NativeWind
 * (the breakpoint's `min-*:` variant evaluates against the window width on
 * native too — no JS breakpoint hook needed):
 *
 *  - `undefined` (DEFAULT) → responsive: full-bleed below the `framedFrom`
 *    breakpoint (default `768` / Tailwind `md`), rounded + bordered at/above it
 *    (e.g. `md:rounded-radius-28 md:border md:border-border`).
 *  - `false` → never framed (plain full-bleed at every size).
 *  - `true` → always rounded + bordered.
 *
 * `showStickyFrame` and `maskColor` are accepted for cross-platform API parity
 * but are no-ops here (there are no sticky overlays on native).
 *
 * Web bundlers select `./index.web` via the `"browser"` export condition in
 * `package.json`; native bundlers fall through to this file.
 *
 * Styling is NativeWind-className-first; the literal class strings below must
 * stay literal so a consumer's Tailwind content-scan over `lib/**` (and the
 * native `src/**`) picks them up.
 */
import React, { memo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { StyledView } from '../styles/styled-primitives';
import {
  ContentPanelNestingContext,
  useContentPanelNestingGuard,
} from './context';
import type { ContentPanelFramedBreakpoint, ContentPanelProps } from './types';

/**
 * Width (in px) of the WEB sticky gutter-mask box-shadow ring. Exported for
 * cross-platform API parity (it has no effect on native).
 */
export const GUTTER_MASK_SPREAD = 40;
/** Top sticky inset (px) of the framed panel chrome. */
export const PANEL_TOP_INSET = 8;
/** Bottom sticky inset (px) of the framed panel chrome. */
export const PANEL_BOTTOM_INSET = 8;

/**
 * Per-breakpoint literal Tailwind surface class bundle for the NATIVE responsive
 * mode. Each value is a WHOLE literal string (never assembled from parts at
 * runtime) so the Tailwind content-scan over `src/**`/`lib/**` picks up every
 * `min-*`/`sm:`/`md:`/`lg:` token verbatim. Selecting a bundle by `framedFrom`
 * value is the only runtime decision.
 */
const RESPONSIVE_SURFACE: Record<ContentPanelFramedBreakpoint, string> = {
  500: 'min-[500px]:overflow-hidden min-[500px]:rounded-radius-28 min-[500px]:border min-[500px]:border-border',
  640: 'sm:overflow-hidden sm:rounded-radius-28 sm:border sm:border-border',
  768: 'md:overflow-hidden md:rounded-radius-28 md:border md:border-border',
  1024: 'lg:overflow-hidden lg:rounded-radius-28 lg:border lg:border-border',
};

const ContentPanelComponent: React.FC<ContentPanelProps> = ({
  children,
  framed,
  framedFrom = 768,
  surfaceClassName,
  surfaceStyle,
  contentClassName,
  contentStyle,
}) => {
  // Dev-only invariant — a ContentPanel must never be nested inside another.
  useContentPanelNestingGuard();

  // Tri-state: `undefined` → responsive (breakpoint-gated), `true` → always
  // framed, `false` → never framed (plain full-bleed). Whole literal class
  // strings are selected per mode so the Tailwind content-scan over `src/**`
  // picks up every `min-*`/`sm:`/`md:`/`lg:` / `rounded-radius-28` token verbatim
  // (the breakpoint bundle lives whole in `RESPONSIVE_SURFACE`; `framed ===
  // true`/`false` ignore `framedFrom` for fixed always/never framing).
  const surfaceBase =
    framed === undefined
      ? `flex-1 ${RESPONSIVE_SURFACE[framedFrom]}`
      : framed
        ? 'flex-1 overflow-hidden rounded-radius-28 border border-border'
        : 'flex-1';
  const surfaceClass = [surfaceBase, surfaceClassName ?? 'bg-card'].join(' ');
  const contentClass = ['flex-1', contentClassName].filter(Boolean).join(' ');

  return (
    <ContentPanelNestingContext.Provider value={true}>
      <StyledView className={surfaceClass} style={surfaceStyle}>
        <StyledView className={contentClass} style={contentStyle}>
          {children}
        </StyledView>
      </StyledView>
    </ContentPanelNestingContext.Provider>
  );
};

export const ContentPanel = memo(ContentPanelComponent);
ContentPanel.displayName = 'ContentPanel';
