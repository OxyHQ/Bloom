/**
 * Ported from expo-glass-tabs v0.1.1 — src/glass-tab-bar.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 *
 * NATIVE variant of the tab bar's capsule surface — real liquid glass, degrading
 * to the solid surface whenever the glass is not actually usable.
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
 * opaque fallback the neutral variant paints. "Installed" is not "usable"
 * though, and BOTH remaining hazards sit at MODULE scope, which is why neither
 * can be handled by a branch inside the component:
 *
 *  1. THE NATIVE MODULE. On iOS `isLiquidGlassAvailable()` resolves
 *     `ExpoGlassEffect` through `requireNativeModule`, which THROWS
 *     `Cannot find native module …` by contract when that module is not in the
 *     binary. For these apps it is a normal deploy state rather than a
 *     misconfiguration: an OTA JS update can land on a binary built before the
 *     package was linked, while the JS side always resolves because expo-router
 *     depends on it. Unguarded, the throw escapes render and takes down the whole
 *     screen the bar is on.
 *  2. THE EXPORTS. `Animated.createAnimatedComponent(GlassView)` runs at IMPORT
 *     time, so a tree that resolves the specifier to something without
 *     `GlassView` hands React an `undefined` element type before any render
 *     happens.
 *
 * `isGlassEffectAPIAvailable()` is upstream's own third condition: on some iOS 26
 * betas `UIGlassEffect` is missing and touching `GlassView` crashes NATIVELY,
 * below JS (expo/expo#40911). It first shipped in expo-glass-effect 0.1.9, which is
 * exactly why the peer floor is `>=0.1.9`: this file imports the symbol STATICALLY,
 * and a floor predating it would be the same incoherence as declaring a
 * statically-imported package optional. The `typeof` guard below is still not
 * redundant — a peer range only WARNS, so a consumer can resolve an older copy
 * anyway. A missing probe therefore means "not applicable", never "unavailable";
 * reading it the other way would delete the glass look from every working device.
 *
 * Everything that fails routes to the SAME solid surface Android already paints —
 * the intended fallback path, not a new one.
 */
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { TabBarSurfaceProps } from './shared';
import { SolidTabBarSurface } from './surface-solid';

/**
 * The animated glass view, or `null` when the package did not deliver the two
 * exports this file needs. Built once, and guarded HERE rather than in the
 * component because `createAnimatedComponent` runs on import (hazard 2 above).
 */
const AnimatedGlassView =
  Boolean(GlassView) && typeof isLiquidGlassAvailable === 'function'
    ? Animated.createAnimatedComponent(GlassView)
    : null;

/** Memo for {@link glassIsUsable} — the answer cannot change within a session. */
let glassUsable: boolean | undefined;

/**
 * Whether this build can really render glass. Probed once: the native lookup
 * behind it is not free, and on the failing path it throws.
 *
 * The `catch` reports rather than swallows. A bar that silently painted itself
 * opaque on every iOS device would be far more expensive to find than one warning
 * line, and reaching this branch always means a real, fixable packaging mistake.
 * Warning exactly once falls out of the memo — the body runs at most one time.
 */
function glassIsUsable(): boolean {
  if (glassUsable !== undefined) return glassUsable;

  try {
    glassUsable =
      isLiquidGlassAvailable() &&
      (typeof isGlassEffectAPIAvailable !== 'function' || isGlassEffectAPIAvailable());
  } catch (error) {
    glassUsable = false;
    // eslint-disable-next-line no-console
    console.warn(
      '[Bloom] TabBar: expo-glass-effect could not report liquid-glass availability, ' +
        'so the bar is painting its solid surface. Install expo-glass-effect and ' +
        'rebuild the native app to get the glass capsule.',
      error,
    );
  }

  return glassUsable;
}

export function TabBarSurface({ theme, style }: TabBarSurfaceProps) {
  if (AnimatedGlassView !== null && glassIsUsable()) {
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

  return <SolidTabBarSurface theme={theme} style={style} />;
}

TabBarSurface.displayName = 'TabBarSurface';

const styles = StyleSheet.create({
  surface: {
    borderCurve: 'continuous',
  },
});
