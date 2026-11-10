/**
 * The native lens material for a control that is not a menu: the same view as a menu trigger,
 * with no rows. It draws the fill (the lens, tinted), springs under the finger and runs on the
 * UI thread; the control inside only draws its content and handles the press.
 */
import { Children, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/use-theme';
import { useLensAvailable } from './lens-material';
import { getNativeLens } from './native-lens';

const NO_ITEMS: never[] = [];

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
export function splitLensStyle(style: StyleProp<ViewStyle>): {
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

interface LensButtonHostProps {
  /** `#rrggbb` or `rgb(...)`; omitted, the lens stays neutral. */
  tint?: string;
  /** The corner radius in dp; omitted, the shape is a capsule. */
  radius?: number;
  style?: ViewStyle;
  children: ReactNode;
}

export function LensButtonHost({ tint, radius, style, children }: LensButtonHostProps) {
  const NativeLens = useLensAvailable() ? getNativeLens() : null;
  const dark = useTheme().isDark;
  if (!NativeLens) return <>{Children.only(children)}</>;
  return (
    <NativeLens
      items={NO_ITEMS}
      lens
      colorScheme={dark ? 'dark' : 'light'}
      cornerRadius={radius}
      triggerConfig={tint ? { tintColor: tint, tintOpacity: 0.96 } : undefined}
      style={[HOST, style]}
    >
      {children}
    </NativeLens>
  );
}

const HOST = { alignSelf: 'flex-start' } as const;
