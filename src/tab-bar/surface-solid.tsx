/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos).
 *
 * The tab bar's NON-GLASS capsule surface: a plain animated view filled with the
 * theme's near-opaque fallback. Android, pre-iOS-26 devices and any build without
 * a usable `expo-glass-effect` all paint this.
 *
 * It lives in its own module because TWO variants render it and one of them
 * cannot reach the other: Metro resolves a bare `./surface` to
 * `surface.native.tsx` no matter which file asks, so `surface.native.tsx`
 * importing its neutral sibling for the fallback would import ITSELF. A name with
 * no platform variants resolves to this one file everywhere — which is the whole
 * point, so please do not fold it back into `surface.tsx`.
 */
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { TabBarSurfaceProps } from './shared';

export function SolidTabBarSurface({ theme, style }: TabBarSurfaceProps) {
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.surface,
        { backgroundColor: theme.solidFallback },
        style,
      ]}
    />
  );
}

SolidTabBarSurface.displayName = 'SolidTabBarSurface';

const styles = StyleSheet.create({
  surface: {
    borderCurve: 'continuous',
  },
});
