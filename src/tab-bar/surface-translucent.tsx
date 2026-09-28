/** Adapted from expo-glass-tabs v0.1.1 (MIT © 2026 David Mokos). */
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SurfacePaint } from '../surface/SurfacePaint';
import type { TabBarSurfaceProps } from './shared';

/** Universal translucent material: shared web optics and native tint, sheen and rim. */
export function TranslucentTabBarSurface({ theme, style }: TabBarSurfaceProps) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <SurfacePaint fill={theme.glassTint} radius={999} glass />
    </Animated.View>
  );
}
TranslucentTabBarSurface.displayName = 'TranslucentTabBarSurface';
TranslucentTabBarSurface.resolveFill = (theme: TabBarSurfaceProps['theme']) => theme.glassTint;
