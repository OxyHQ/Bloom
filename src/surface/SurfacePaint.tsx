import { pointerEventsStyle } from '../styles/pointer-events';
import { surfaceStyle } from '../shapes/surface-style';
import type { SurfaceShape, SurfaceStyle } from '../shapes/corner-types';
import { memo, useEffect } from 'react';
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
  translucentTint,
  resolveSurfaceOptics,
  surfaceContrastEdge,
  surfaceOpticsVars,
} from './shared';
import { SURFACE_HAIRLINE_VAR } from './web-material';
import { useSurfacePaintLayer } from './use-surface-paint-layer';
import { SurfaceBlur } from './SurfaceBlur';
import { useReducedTransparency } from '../theme/reduced-transparency';
import { useIncreasedContrast } from '../theme/increased-contrast';
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
 * `backgroundColor`, rim and sheen as inset `boxShadow`s): no SVG, no layout
 * state. On iOS a `floating` surface also has the system's material under its
 * tint (`SurfaceBlur`). Nowhere else on native: a `BlurView` inside a surface
 * can SIGSEGV on Android, and an in-flow surface has nothing moving behind it.
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
  floating = false,
  testID,
}: {
  sheen?: boolean;
  /**
   * The surface floats over content that moves or differs under it: a bar,
   * an island, a sheet, a dialog, a toast, a tooltip. On iOS it then draws the
   * system's material (a `UIVisualEffectView`) under a translucent tint, as the
   * web's material does, unless transparency is reduced. Nothing changes on
   * the web (where every material filters its backdrop) or on Android.
   * A `composite` fill keeps the opaque paint: its token reads over the surface.
   */
  floating?: boolean;
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
  const opticsRecipe = useThemeRecipe((theme) => ({
    ...resolveSurfaceOptics(theme.isDark),
    text: theme.colors.text,
  }));
  const optics = opticsRecipe.paint;
  // Colour arithmetic reads the concrete theme, never a prepaint variable.
  const text = opticsRecipe.current.text;
  const increasedContrast = useIncreasedContrast();
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
  const layerRef = useSurfacePaintLayer(
    isWeb && transition === undefined,
    paintFill,
    resolvedFill,
    optics,
    rim,
  );
  if (isWeb) {
    const solid = compositeOnto(paintFill ?? resolvedFill, backing ?? contextBacking);
    const paintStyle: WebCssStyle = {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...geometry,
      backgroundColor: 'transparent',
      '--bloom-surface-paint-fill': paintFill ?? resolvedFill,
      '--bloom-surface-solid': solid,
      // A host that draws its own border (`rim={false}`) keeps it as its edge.
      [SURFACE_HAIRLINE_VAR]: rim ? surfaceContrastEdge(solid, text) : 'transparent',
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
          ref={layerRef as never}
          testID={testID}
          // The semantic fill the material tints with, before its translucency;
          // the layer mark lets the baked material find its host.
          {...webDataSet({
            bloomPaintLayer: '',
            ...(fill === undefined ? null : { bloomSurfaceFill: fill }),
          })}
          className="bloom-surface-paint"
          style={[paintStyle, pointerEventsStyle('none')]}
        />
      </>
    );
  }
  // Increased contrast: a 1px hairline that holds 3:1 against the body replaces
  // the edge light. A border, not a shadow, so every renderer draws it (OxyOS's
  // host draws no box shadows).
  const edge: ViewStyle | null =
    increasedContrast && rim
      ? { borderWidth: 1, borderColor: surfaceContrastEdge(paintFill ?? resolvedFill, text) }
      : !increasedContrast && (rim || sheen)
        ? {
            boxShadow: [rim ? optics.rim : null, sheen ? optics.sheenShadow : null]
              .filter(Boolean)
              .join(', '),
          }
        : null;
  const body = fill === undefined ? 'transparent' : resolvedFill;
  if (Platform.OS === 'ios' && floating && !composite && fill !== undefined) {
    return (
      <FloatingIosPaint
        testID={testID}
        geometry={geometry}
        body={body}
        edge={edge}
        presence={presence}
      />
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
            backgroundColor: body,
            ...edge,
            ...(presence === undefined ? null : { opacity: presence }),
          },
        ],
        pointerEventsStyle('none'),
      ]}
    />
  );
});

/**
 * A floating surface on iOS: the system's material, the tint over it at the
 * web's `SURFACE_TINT_OPACITY` (an explicit alpha is kept), then the edge on
 * top, all clipped to the surface's shape. With transparency reduced (or
 * contrast increased, which reduces it) it is the opaque paint every other
 * native surface draws: the colour the surface publishes to its content.
 * Only a floating surface reads the switch, so in-flow surfaces pay nothing.
 */
function FloatingIosPaint({
  testID,
  geometry,
  body,
  edge,
  presence,
}: {
  testID?: string;
  geometry: ViewStyle;
  body: string;
  edge: ViewStyle | null;
  presence?: number;
}) {
  const reduced = useReducedTransparency();
  const opacity = presence === undefined ? null : { opacity: presence };
  if (reduced) {
    return (
      <View
        testID={testID}
        style={[
          [
            StyleSheet.absoluteFill,
            geometry,
            { overflow: 'hidden', backgroundColor: body },
            edge,
            opacity,
          ],
          pointerEventsStyle('none'),
        ]}
      />
    );
  }
  return (
    <View
      testID={testID}
      style={[
        [StyleSheet.absoluteFill, geometry, { overflow: 'hidden' }, opacity],
        pointerEventsStyle('none'),
      ]}
    >
      <SurfaceBlur />
      <View
        testID={testID ? `${testID}-tint` : undefined}
        style={[
          [StyleSheet.absoluteFill, geometry, { backgroundColor: translucentTint(body) }, edge],
          pointerEventsStyle('none'),
        ]}
      />
    </View>
  );
}
