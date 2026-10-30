import { pointerEventsStyle } from '../styles/pointer-events';
import { surfaceStyle } from '../shapes/surface-style';
import type { SurfaceShape, SurfaceStyle } from '../shapes/corner-types';
import React, { memo, useEffect } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { StyledView } from '../styles/styled-primitives';
import { webDataSet } from '../styles/web-data';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { surfaceMaterialCss } from './web-material';
import { useThemeRecipe } from '../theme/use-theme-paint';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import {
  compositeOnto,
  resolveSurfaceTint,
  resolveSurfaceOptics,
  surfaceOpticsVars,
} from './shared';
import { useSurfaceFill } from '../styles/surface-levels';

// Backing participates only in web compositing. Native uses the supplied tint
// directly, so it does not subscribe every painted surface to the backing tree.
const useCompositeBacking = Platform.OS === 'web' ? useSurfaceFill : () => 'transparent';

const WEB_PAINT_CSS = `
.bloom-surface-paint { isolation: isolate; overflow: clip; overflow-clip-margin: 1px; }
${surfaceMaterialCss('.bloom-surface-paint', 'var(--bloom-surface-paint-fill)', 'var(--bloom-surface-paint-transition, background-color 0s)')}
`;

/**
 * The material under a surface's content: tint, sheen and rim.
 *
 * Web adds a backdrop blur beneath them. Native paints one `View` (tint as
 * `backgroundColor`, rim and sheen as inset `boxShadow`s):
 * no SVG, no layout state, no per-surface blur. A `BlurView` inside a surface
 * can SIGSEGV on Android, so native blur lives only in `overlay/` `Backdrop`.
 */
export const SurfacePaint = memo(function SurfacePaint({
  fill,
  paintFill,
  radius,
  shape,
  geometryStyle,
  direction = 'ltr',
  sheen = true,
  rim = true,
  outset = 0,
  composite = false,
  backing,
  transition,
  presence,
  presenceMs,
  testID,
}: {
  sheen?: boolean;
  /**
   * The inset highlight rim. A host that draws its own border turns this off,
   * or the two read as one double stroke.
   */
  rim?: boolean;
  testID?: string;
  /**
   * The host's own border width. An absolute child sits inside the border, so a
   * host whose border is a state ring (transparent at rest) passes it here and
   * the paint covers the whole border box, as a CSS background would.
   */
  outset?: number;
  /**
   * The fill is a theme token designed to read over the surface it sits on
   * (a translucent tint such as an error or accent wash). On the web, composite
   * it onto that surface first, so the material shows the colour the token reads
   * as instead of the filtered backdrop through its transparency. Native has no
   * backdrop filter, so its translucent fill already reads as designed.
   */
  composite?: boolean;
  /** What `composite` composites onto when it is not the surface in context. */
  backing?: string;
  /** Web only: how the fill changes between states, e.g. `background-color 200ms ease`. */
  transition?: string;
  /**
   * How present the material is, 0 to 1: how a disabled control dims it. Never
   * dim a material's host or an ancestor with `opacity` or `filter` instead: on
   * the web that ancestor becomes the backdrop root and the blur vanishes.
   * Omitted, the paint inherits a fading host's `--bloom-surface-presence`.
   */
  presence?: number;
  /** Web only: how long a change of `presence` takes, in milliseconds. */
  presenceMs?: number;
  /** Omit for sheen/rim only on a host that already owns its fill. */
  fill?: string;
  /** Final paired tint supplied by the material owner; never used for colour math. */
  paintFill?: string;
  radius?: NonNullable<ViewStyle['borderRadius']>;
  /** Same policy as the host; radius can remain owned by an animated host. */
  shape?: SurfaceShape;
  direction?: 'ltr' | 'rtl';
  /** Resolved geometry shared with a concentric host, including web expressions. */
  geometryStyle?: SurfaceStyle;
}) {
  const geometry = {
    ...(outset ? { top: -outset, right: -outset, bottom: -outset, left: -outset } : null),
    ...(radius === undefined ? {} : { borderRadius: radius }),
    ...surfaceStyle(shape ?? { curve: 'round' }, direction),
    ...geometryStyle,
  };
  const opticsRecipe = useThemeRecipe((theme) => resolveSurfaceOptics(theme.isDark));
  const optics = opticsRecipe.paint;
  const isWeb = Platform.OS === 'web';
  const contextBacking = useCompositeBacking();
  const resolvedFill = resolveSurfaceTint(
    composite && isWeb && fill !== undefined
      ? compositeOnto(fill, backing ?? contextBacking)
      : (fill ?? 'transparent'),
  );
  useEffect(() => {
    if (isWeb) adoptStyleSheet('bloom-surface-paint-web-css', WEB_PAINT_CSS);
  }, [isWeb]);
  if (isWeb) {
    const paintStyle: WebCssStyle = {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...geometry,
      backgroundColor: 'transparent',
      '--bloom-surface-paint-fill': paintFill ?? resolvedFill,
      '--bloom-surface-solid': compositeOnto(paintFill ?? resolvedFill, backing ?? contextBacking),
      ...(transition ? { '--bloom-surface-paint-transition': transition } : null),
      ...(presence === undefined ? null : { '--bloom-surface-presence': String(presence) }),
      ...(presenceMs === undefined ? null : { '--bloom-surface-presence-ms': `${presenceMs}ms` }),
      ...surfaceOpticsVars(optics, radius, rim),
    };
    return (
      <>
        {opticsRecipe.sheet}
        <ServerStyleSheet id="bloom-surface-paint-web-css" css={WEB_PAINT_CSS} />
        <StyledView
          testID={testID}
          // The semantic fill the material tints with, before its translucency.
          {...(fill === undefined ? null : webDataSet({ bloomSurfaceFill: fill }))}
          className="bloom-surface-paint"
          style={[paintStyle, pointerEventsStyle('none')]}
        />
      </>
    );
  }
  return (
    <View
      testID={testID}
      // Only decorative paint owns a texture; content keeps its normal rendering.
      // Android invalidates this layer when fill/geometry/optics props change.
      renderToHardwareTextureAndroid={Platform.OS === 'android' && (rim || sheen)}
      style={[
        [
          StyleSheet.absoluteFill,
          geometry,
          {
            overflow: 'hidden',
            backgroundColor: fill === undefined ? 'transparent' : resolvedFill,
            ...(rim || sheen
              ? {
                  boxShadow: [rim ? optics.rim : null, sheen ? optics.sheenShadow : null]
                    .filter(Boolean)
                    .join(', '),
                }
              : null),
            ...(presence === undefined ? null : { opacity: presence }),
          },
        ],
        pointerEventsStyle('none'),
      ]}
    />
  );
});
