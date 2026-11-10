/**
 * The native glass material for a control that is not a menu: the same view as a menu trigger,
 * with no rows. It draws the fill (the glass, tinted), springs under the finger and runs on the
 * UI thread; the control inside only draws its content and handles the press.
 */
import { Children, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme/use-theme';
import { getNativeGlassMenu } from './native-glass-menu';

const NO_ITEMS: never[] = [];

/** The style keys that place a control among its siblings: they belong to the glass host. */
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

type PlacementKey = (typeof PLACEMENT_KEYS)[number];

/**
 * Splits a control's style in two: where it sits (the host's) and what it looks like and how big
 * it is (the control's). Size stays with both so the host and the control are the same box.
 */
export function splitGlassStyle(style: StyleProp<ViewStyle>): {
  host: ViewStyle;
  control: ViewStyle;
} {
  const flat = StyleSheet.flatten(style) ?? {};
  const host: Record<string, unknown> = {};
  const control: Record<string, unknown> = { ...flat };
  for (const key of PLACEMENT_KEYS) {
    if (key in flat) {
      host[key] = flat[key as PlacementKey];
      delete control[key];
    }
  }
  for (const key of [
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
  ] as const) {
    if (key in flat) host[key] = flat[key];
  }
  return { host: host as ViewStyle, control: control as ViewStyle };
}

export interface GlassButtonHostProps {
  /** `#rrggbb` or `rgb(...)`; omitted, the glass stays neutral. */
  tint?: string;
  /** The corner radius in dp; omitted, the shape is a capsule. */
  radius?: number;
  style?: ViewStyle;
  children: ReactNode;
}

export function GlassButtonHost({ tint, radius, style, children }: GlassButtonHostProps) {
  const NativeGlass = getNativeGlassMenu();
  const dark = useTheme().isDark;
  if (!NativeGlass) return <>{Children.only(children)}</>;
  return (
    <NativeGlass
      items={NO_ITEMS}
      glass
      colorScheme={dark ? 'dark' : 'light'}
      cornerRadius={radius}
      triggerConfig={tint ? { tintColor: tint, tintOpacity: 0.96 } : undefined}
      style={[HOST, style]}
    >
      {children}
    </NativeGlass>
  );
}

const HOST = { alignSelf: 'flex-start' } as const;
