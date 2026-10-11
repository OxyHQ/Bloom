import { PanelErrorBoundary } from '../error-boundary/PanelErrorBoundary';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
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
 * surface is rounded + bordered, tri-state with responsive NativeWind borders
 * (the material and scoped radius follow the same window breakpoint):
 *
 *  - `undefined` (DEFAULT) → responsive: full-bleed below the `framedFrom`
 *    breakpoint (default `768` / Tailwind `md`), rounded + bordered at/above it
 *    (e.g. `md:border md:border-border`).
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
import { SurfacePaint } from '../surface/SurfacePaint';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { useOptionalPanelChrome, usePanelShape } from '../styles/panel-chrome';
import { surfaceStyle as resolveShapeStyle } from '../shapes/surface-style';
import { StyledView } from '../styles/styled-primitives';
import {
  SurfaceLevelProvider,
  surfaceFillVars,
  useOptionalSurfaceFill,
  useSurfaceLevelValue,
} from '../styles/surface-levels';
import { ContentPanelNestingContext, useContentPanelNestingGuard } from './context';
import { usePanelSurfaceFill } from './shared';
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
  500: 'min-[500px]:border min-[500px]:border-border',
  640: 'sm:border sm:border-border',
  768: 'md:border md:border-border',
  1024: 'lg:border lg:border-border',
};

const RESPONSIVE_CONTENT: Record<ContentPanelFramedBreakpoint, string> = {
  500: 'min-[500px]:overflow-hidden',
  640: 'sm:overflow-hidden',
  768: 'md:overflow-hidden',
  1024: 'lg:overflow-hidden',
};

const ContentPanelComponent: React.FC<ContentPanelProps> = ({
  children,
  errorBoundary = false,
  appearance = 'solid',
  framed,
  framedFrom = 768,
  fill = false,
  surfaceClassName,
  surfaceStyle,
  surfaceColor,
  chrome = 'elevated',
  shadow,
  contentClassName,
  contentStyle,
}) => {
  // Dev-only invariant — a ContentPanel must never be nested inside another.
  useContentPanelNestingGuard();
  const panelShape = usePanelShape();
  const panelChrome = useOptionalPanelChrome();
  // What the panel tells its subtree it is painted in (`./shared.ts`).
  const rawFill = usePanelSurfaceFill(surfaceClassName, surfaceStyle, surfaceColor);
  const defaultFill = rawFill;
  const { width } = useWindowDimensions();
  const parentFill = useOptionalSurfaceFill();
  const parentLevel = useSurfaceLevelValue();
  const isPlain = appearance === 'plain';
  const paintsSurface =
    !isPlain &&
    Boolean(defaultFill) &&
    parentFill !== undefined &&
    (framed ?? width >= framedFrom) &&
    chrome !== 'none';
  const publishedFill = isPlain
    ? parentFill
    : rawFill && paintsSurface
      ? resolveSurfaceMaterial({ fill: rawFill, parentFill: parentFill! }).publishedFill
      : rawFill;
  const radius = StyleSheet.flatten(surfaceStyle)?.borderRadius ?? panelShape.radius;
  const isFramed = framed ?? width >= framedFrom;
  const geometry = {
    ...resolveShapeStyle({ curve: panelShape.curve }),
    borderRadius: isFramed ? radius : 0,
  };

  // Tri-state: `undefined` → responsive (breakpoint-gated), `true` → always
  // framed, `false` → never framed (plain full-bleed). Whole literal class
  // strings are selected per mode so the Tailwind content-scan over `src/**`
  // picks up every `min-*`/`sm:`/`md:`/`lg:` token verbatim
  // (the breakpoint bundle lives whole in `RESPONSIVE_SURFACE`; `framed ===
  // true`/`false` ignore `framedFrom` for fixed always/never framing).
  const surfaceBase =
    isPlain || chrome === 'none'
      ? 'flex-1'
      : framed === undefined
        ? `flex-1 ${RESPONSIVE_SURFACE[framedFrom]}`
        : framed
          ? 'flex-1 border border-border'
          : 'flex-1';
  const surfaceClass = [
    surfaceBase,
    fill ? 'min-h-0' : '',
    surfaceClassName ?? (isPlain || paintsSurface ? 'bg-transparent' : 'bg-card'),
  ]
    .filter(Boolean)
    .join(' ');
  // Native has no overlays: the surface itself carries the edge. `none` drops
  // both, `border` keeps the class-drawn hairline, `elevated` adds the lift.
  const chromeStyle =
    !isFramed || isPlain || chrome === 'none' || chrome === 'border'
      ? null
      : shadow || panelChrome
        ? { boxShadow: shadow ?? panelChrome?.shadow }
        : null;
  // `fill` is the panel's own height contract, and on native it is already
  // met: both boxes are `flex: 1`, so in a bounded parent the panel reaches the
  // bottom and a list inside it scrolls within it. What the prop adds here is
  // `min-h-0`, so a tall child cannot push the panel past the box it was given
  // — the same automatic-minimum-size trap as on web.
  const contentClass = [
    'flex-1',
    framed === true
      ? 'overflow-hidden'
      : framed === undefined
        ? RESPONSIVE_CONTENT[framedFrom]
        : '',
    fill ? 'min-h-0' : '',
    contentClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ContentPanelNestingContext.Provider value={true}>
      <StyledView
        testID="content-panel-surface"
        className={surfaceClass}
        style={[
          // The surface variable rides the element that carries the fill, so
          // the two can never disagree. A no-op on native; the provider below
          // is what answers there. (`styles/surface-levels.ts`.)
          surfaceFillVars(publishedFill),
          geometry,
          chromeStyle,
          surfaceStyle,
          isPlain || paintsSurface ? { backgroundColor: 'transparent' } : null,
        ]}
      >
        {paintsSurface ? (
          <SurfacePaint fill={defaultFill!} radius={radius} shape={{ curve: panelShape.curve }} />
        ) : null}
        <StyledView
          testID="content-panel-content"
          className={contentClass}
          style={[geometry, contentStyle]}
        >
          {/* Solid panels publish their painted surface. Plain panels preserve
              the enclosing surface so descendant scrims follow its real fill. */}
          <SurfaceLevelProvider level={isPlain ? parentLevel : 1} fill={publishedFill}>
            {errorBoundary === false ? (
              children
            ) : (
              <PanelErrorBoundary {...(errorBoundary === true ? {} : errorBoundary)}>
                {children}
              </PanelErrorBoundary>
            )}
          </SurfaceLevelProvider>
        </StyledView>
      </StyledView>
    </ContentPanelNestingContext.Provider>
  );
};

export const ContentPanel = memo(ContentPanelComponent);
ContentPanel.displayName = 'ContentPanel';
