/**
 * The one material decision for every Bloom control the lens can draw (a Button, a Button.Group, a
 * Surface, a BlurIsland, the tab bar). Where the device has the native lens (Android
 * 33+ with `@oxy.so/bloom-lens`), the control asks for it and it is not inside a lens base or a
 * separate window (a Dialog, a BottomSheet), the lens base draws the material (the fill, tinted,
 * its shadow and light), springs under the finger and runs on the UI thread; the control only draws
 * its content and handles the press. Everywhere else (the web, iOS, Android without the lens or
 * below API 33, a Modal's window) the control paints Bloom's own material (`SurfacePaint`).
 *
 *   const frame = useLensFrame(material === 'lens', style);
 *   // The control takes `frame.style`, and paints `SurfacePaint` only when `frame.lens` is false.
 *   return withLens(frame, control, { radius });
 *
 * The control gives its paint and its lens the same fill and radius, so the two never diverge. In
 * the page's content the lens is drawn in its place, against the surface the control sits on; in a
 * floating region (or for a control that floats by itself) the window draws it.
 */
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/use-theme';
import { useSurfaceFillForSnapshot, useSurfaceSnapshot } from '../../styles/surface-levels';
import { LENS_FROST } from './lens-frost';
import { LENS_FILL_TINT } from './lens-tint';
import { useInFloatingRegion, useLensAvailable } from './lens-material';
import { getNativeLens } from './native-lens';

/** The style keys that place a control among its siblings: they belong to the lens host. */
const PLACEMENT_KEYS = [
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'start',
  'end',
  'zIndex',
  'alignSelf',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
] as const;

/**
 * Splits a control's style in two: where it sits (the host's) and what it looks like and how big
 * it is (the control's). Size stays with both so the host and the control are the same box.
 */
function splitLensStyle(style: StyleProp<ViewStyle>): {
  host: ViewStyle;
  control: ViewStyle;
} {
  const flat = StyleSheet.flatten(style) ?? {};
  const { position, top, right, bottom, left, start, end, zIndex, alignSelf } = flat;
  const { flex, flexGrow, flexShrink, flexBasis } = flat;
  const { margin, marginTop, marginRight, marginBottom, marginLeft } = flat;
  const { marginHorizontal, marginVertical, marginStart, marginEnd } = flat;
  const { width, height, minWidth, minHeight, maxWidth, maxHeight } = flat;
  const host: ViewStyle = {
    position,
    top,
    right,
    bottom,
    left,
    start,
    end,
    zIndex,
    alignSelf,
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    margin,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    marginHorizontal,
    marginVertical,
    marginStart,
    marginEnd,
    // Size stays with both, so the host and the control are the same box.
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
  };
  const control: ViewStyle = { ...flat };
  for (const key of PLACEMENT_KEYS) delete control[key];
  return { host: definedOnly(host), control };
}

function definedOnly(style: ViewStyle): ViewStyle {
  return Object.fromEntries(Object.entries(style).filter(([, value]) => value !== undefined));
}

/** Whether the lens draws a control, and the control's style for it. */
export interface LensFrame {
  /** The native lens draws the material: the control paints none of its own. */
  lens: boolean;
  /** The control's own style: on the lens, without the placement the lens host takes. */
  style: StyleProp<ViewStyle>;
  /** Where the control sits, on the lens host; `undefined` off the lens. */
  host: ViewStyle | undefined;
}

/**
 * Whether the native lens draws this control (`wanted`: the control's material is the lens), and
 * its style split for it: the lens host takes the placement, the control keeps its look and size.
 */
export function useLensFrame(wanted: boolean, style: StyleProp<ViewStyle>): LensFrame {
  const lens = useLensAvailable() && wanted;
  if (!lens) return { lens, style, host: undefined };
  const split = splitLensStyle(style);
  return { lens, style: split.control, host: split.host };
}

/** How the lens draws a control: the same fill and radius the control paints off the lens. */
export interface LensLook {
  /** `#rrggbb` or `rgb(...)`, a solid control's fill; omitted, the lens stays neutral. */
  tint?: string;
  /** The corner radius in dp; omitted, the shape is a capsule. */
  radius?: number;
  /** How far the press and the drag deform the lens, a multiplier of the engine's own (1). */
  jelly?: number;
  /**
   * The control floats by itself (the tab bar, an island over a map): the window draws its lens over
   * what moves behind, wherever it is. Any other control is drawn by the window only in a floating
   * region (a floating header, a toolbar, a bar, a FAB); in the page's content its lens is drawn in
   * its place, against the surface it sits on, so it scrolls and stacks with the page.
   */
  floating?: boolean;
}

/** On the lens, the control inside its lens host; off it, the control as it is. */
export function withLens(frame: LensFrame, control: ReactElement, look: LensLook): ReactElement {
  if (!frame.lens) return control;
  return (
    <LensButtonHost {...look} style={frame.host}>
      {control}
    </LensButtonHost>
  );
}

interface LensButtonHostProps extends LensLook {
  style?: ViewStyle;
  children: ReactElement;
}

/** The lens base around a control its frame put on the lens (`withLens`). */
function LensButtonHost({ tint, radius, jelly, floating, style, children }: LensButtonHostProps) {
  const theme = useTheme();
  const inFloatingRegion = useInFloatingRegion();
  const backing = useSurfaceFillForSnapshot(theme, useSurfaceSnapshot());
  // The same lens keeps the same config, so a render that changes nothing sends the engine nothing.
  const config = useMemo(
    () => ({
      blur: LENS_FROST.control,
      ...(tint ? { tintColor: tint, tintOpacity: LENS_FILL_TINT } : null),
      ...(jelly === undefined ? null : { jelly }),
    }),
    [tint, jelly],
  );
  const native = getNativeLens();
  if (!native) return children;
  const { LensBase } = native;
  // The one lens base (the upstream app's lens trigger): what it holds draws no lens of its own,
  // and a menu opened from inside it grows out of it. In the page it samples the surface it sits
  // on, not the window, and shares one still with every control that looks the same.
  return (
    <LensBase
      colorScheme={theme.isDark ? 'dark' : 'light'}
      cornerRadius={radius}
      config={config}
      restBackdrop={floating || inFloatingRegion ? undefined : backing}
      style={[HOST, style]}
    >
      {children}
    </LensBase>
  );
}

const HOST = { alignSelf: 'flex-start' } as const;
