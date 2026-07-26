/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 *
 * NATIVE variant of the tab bar's capsule surface — real liquid glass.
 *
 * `expo-glass-effect` is imported STATICALLY and this file is the only place it
 * appears: Metro selects `.native` on iOS/Android, so the import never reaches
 * a web bundle or a consumer's type-check (that is what the neutral
 * `surface.tsx` sibling is for). A peer dependency plus a static import plus a
 * runtime capability check is the deliberate shape here — not a lazy
 * `require()`, which Metro cannot bundle from published `lib/` when the module
 * name is dynamic and which would also hide the dependency from consumers.
 *
 * `isLiquidGlassAvailable()` is false on Android and pre-iOS-26, where the
 * package's `GlassView` has no material to render; those platforms get the same
 * opaque fallback the neutral variant paints.
 */
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { TabBarSurfaceProps } from './shared';

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

export function TabBarSurface({ theme, style }: TabBarSurfaceProps) {
  if (isLiquidGlassAvailable()) {
    return (
      <AnimatedGlassView
        glassEffectStyle="regular"
        style={[
          StyleSheet.absoluteFill,
          styles.surface,
          { backgroundColor: theme.glassTint },
          style,
        ]}
      />
    );
  }

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
