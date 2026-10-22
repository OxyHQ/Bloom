import { pointerEventsStyle } from '../styles/pointer-events';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SurfacePaint } from '../surface/SurfacePaint';
import type { TabBarSurfaceProps } from './shared';

/** The capsule material, identical on every platform: the shared tint, sheen and rim. */
export function TabBarSurface({ theme, paintFill, style }: TabBarSurfaceProps) {
  return (
    <Animated.View style={[[StyleSheet.absoluteFill, style], pointerEventsStyle('none')]}>
      <SurfacePaint fill={theme.blurTint} paintFill={paintFill} radius={999} />
    </Animated.View>
  );
}
TabBarSurface.displayName = 'TabBarSurface';
