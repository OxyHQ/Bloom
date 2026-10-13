import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SurfacePaint } from '../surface/SurfacePaint';
import type { TabBarSurfaceProps } from './shared';

/** The capsule material, identical on every platform: the shared tint, sheen and rim. */
export function TabBarSurface({ theme, style }: TabBarSurfaceProps) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <SurfacePaint fill={theme.blurTint} radius={999} />
    </Animated.View>
  );
}
TabBarSurface.displayName = 'TabBarSurface';
