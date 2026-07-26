/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 *
 * NEUTRAL default variant of the tab bar's capsule surface: a plain animated
 * view filled with the theme's solid fallback.
 *
 * This is the file resolved by everything that does NOT do React Native's
 * platform-extension resolution — a consumer's `tsc` (which follows Bloom's
 * `"react-native"` source export condition) and any non-Metro bundler reading
 * the published `lib/`. It therefore imports NOTHING platform-specific:
 * `expo-glass-effect` is native-only, and a static import of it from a file a
 * web bundler or a consumer's type-checker resolves would break module
 * resolution outright. Same three-way split, for the same reason, as
 * `theme/native-root-vars{,.native,.web}.ts`.
 *
 * The variants — all three implement `TabBarSurfaceProps` exactly, so the entry
 * modules can swap them freely:
 *   - `surface.native.tsx` — iOS/Android (Metro), real `UIGlassEffect` glass;
 *   - `surface.web.tsx`    — web, a CSS `backdrop-filter`;
 *   - this file            — everywhere else, the opaque fallback.
 */
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { TabBarSurfaceProps } from './shared';

export function TabBarSurface({ theme, style }: TabBarSurfaceProps) {
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

TabBarSurface.displayName = 'TabBarSurface';

const styles = StyleSheet.create({
  surface: {
    borderCurve: 'continuous',
  },
});
