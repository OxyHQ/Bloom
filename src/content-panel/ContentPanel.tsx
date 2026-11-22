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
 * surface is rounded + bordered, tri-state with a responsive border (the
 * material and scoped radius follow the same window breakpoint):
 *
 *  - `undefined` (DEFAULT) → responsive: full-bleed below the `framedFrom`
 *    breakpoint (default `768`), rounded + bordered at/above it.
 *  - `false` → never framed (plain full-bleed at every size).
 *  - `true` → always rounded + bordered.
 *
 * `showStickyFrame` and `maskColor` are accepted for cross-platform API parity
 * but are no-ops here (there are no sticky overlays on native).
 *
 * Web bundlers select `./index.web` via the `"browser"` export condition in
 * `package.json`; native bundlers fall through to this file.
 */
import type React from 'react';
import { memo } from 'react';
import { SurfacePaint } from '../surface/SurfacePaint';
import { StyleSheet, View } from 'react-native';
import { useWindowWidthClass } from '../hooks/use-width-class';

import { useOptionalPanelChrome, usePanelShape } from '../styles/panel-chrome';
import { surfaceStyle as resolveShapeStyle } from '../shapes/surface-style';
import {
  SurfaceLevelProvider,
  surfaceFillVars,
  useOptionalSurfaceFill,
  useSurfaceLevelValue,
} from '../styles/surface-levels';
import { createTokenStyles } from '../theme/color-tokens';
import { ContentPanelNestingContext, useContentPanelNestingGuard } from './context';
import { usePanelSurfaceFill } from './shared';
import type { ContentPanelFramedBreakpoint, ContentPanelProps } from './types';
import { cornersStyle, cornerValues, styledCorners } from '../concentric/geometry';

const PHYSICAL_CORNERS = [
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
] as const;

/**
 * Width (in px) of the WEB sticky gutter-mask box-shadow ring. Exported for
 * cross-platform API parity (it has no effect on native).
 */
export const GUTTER_MASK_SPREAD = 40;
/** Top sticky inset (px) of the framed panel chrome. */
export const PANEL_TOP_INSET = 8;
/** Bottom sticky inset (px) of the framed panel chrome. */
export const PANEL_BOTTOM_INSET = 8;

const styles = StyleSheet.create({
  fill: { flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
  bounded: { minHeight: 0 },
  clipped: { overflow: 'hidden' },
});

const useStyles = createTokenStyles((t) => ({
  framed: { borderStyle: 'solid', borderWidth: 1, borderColor: t.border },
  card: { backgroundColor: t.card },
  clear: { backgroundColor: '#0000' },
}));

const ContentPanelComponent: React.FC<ContentPanelProps> = ({
  children,
  errorBoundary = false,
  appearance = 'solid',
  framed,
  framedFrom = 768,
  fill = false,
  surfaceStyle,
  surfaceColor,
  chrome = 'elevated',
  shadow,
  contentStyle,
}) => {
  // Dev-only invariant — a ContentPanel must never be nested inside another.
  useContentPanelNestingGuard();
  const themed = useStyles();
  const panelShape = usePanelShape();
  const panelChrome = useOptionalPanelChrome();
  // What the panel tells its subtree it is painted in (`./shared.ts`).
  const rawFill = usePanelSurfaceFill(surfaceStyle, surfaceColor);
  const defaultFill = rawFill;
  // The window at the framing breakpoint only: never a re-render per pixel.
  const width = useWindowWidthClass([framedFrom]);
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
  const flatSurface = StyleSheet.flatten(surfaceStyle);
  const radius = flatSurface?.borderRadius ?? panelShape.radius;
  const isFramed = framed ?? width >= framedFrom;
  // Corners of their own in `surfaceStyle` (a panel along a window's top edge
  // takes the window's concentric radius there): the content clip and the
  // material follow them too, the others keep the panel's radius.
  const ownCorners =
    isFramed &&
    typeof radius === 'number' &&
    flatSurface &&
    PHYSICAL_CORNERS.some((key) => flatSurface[key] != null)
      ? cornersStyle(
          styledCorners({ ...flatSurface, borderRadius: radius }) ?? cornerValues(radius),
        )
      : null;
  const geometry = {
    ...resolveShapeStyle({ curve: panelShape.curve }),
    borderRadius: isFramed ? radius : 0,
    ...ownCorners,
  };

  // `framed` undefined frames from `framedFrom` up; `true` and `false` always
  // and never frame. A framed surface draws a hairline; its content clips.
  const surfaceFrame = !isPlain && chrome !== 'none' && isFramed ? themed.framed : null;
  const surfaceFill = isPlain || paintsSurface ? themed.clear : themed.card;
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
  return (
    <ContentPanelNestingContext.Provider value={true}>
      <View
        testID="content-panel-surface"
        style={[
          styles.fill,
          surfaceFrame,
          fill ? styles.bounded : null,
          surfaceFill,
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
          <SurfacePaint
            fill={defaultFill!}
            radius={radius}
            shape={{ curve: panelShape.curve }}
            {...(ownCorners ? { geometryStyle: ownCorners } : null)}
          />
        ) : null}
        <View
          testID="content-panel-content"
          style={[
            styles.fill,
            isFramed ? styles.clipped : null,
            fill ? styles.bounded : null,
            geometry,
            contentStyle,
          ]}
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
        </View>
      </View>
    </ContentPanelNestingContext.Provider>
  );
};

export const ContentPanel = memo(ContentPanelComponent);
ContentPanel.displayName = 'ContentPanel';
