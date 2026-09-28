/** Adapted from expo-glass-tabs v0.1.1 (MIT © 2026 David Mokos). */
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SurfacePaint } from '../surface/SurfacePaint';
import type { TabBarSurfaceProps } from './shared';

/** Universal body and edge material: shared web optics and native tint, sheen and rim. */
export function SharedTabBarSurface({ theme, style }: TabBarSurfaceProps) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <SurfacePaint fill={theme.glassTint} radius={999} />
    </Animated.View>
  );
}
SharedTabBarSurface.displayName = 'SharedTabBarSurface';
SharedTabBarSurface.resolveFill = (theme: TabBarSurfaceProps['theme']) => theme.glassTint;
