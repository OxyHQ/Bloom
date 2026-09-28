import { surfaceStyle } from '../shapes/surface-style';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
/** Adapted from expo-glass-tabs v0.1.1 (MIT © 2026 David Mokos). */
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SurfacePaint } from '../surface/SurfacePaint';
import type { TabBarSurfaceProps } from './shared';

/** Shared solid material; keep the animated capsule host for minimize motion. */
export function SolidTabBarSurface({ theme, style }: TabBarSurfaceProps) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, surfaceStyle(SURFACE_SHAPES.capsule), style]}>
      <SurfacePaint fill={theme.solidFallback} radius={999} />
    </Animated.View>
  );
}
SolidTabBarSurface.displayName = 'SolidTabBarSurface';
SolidTabBarSurface.resolveFill = (theme: TabBarSurfaceProps['theme']) => theme.solidFallback;
