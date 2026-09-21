import React, { useEffect } from 'react';
import { View, type StyleProp, type TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { animation } from '../styles/tokens';
import type { TypeScaleVariant } from '../typography/scale';
import { Text } from '../typography';

/** Measures once per label layout; reversals start at the current visual width. */
export function FabLabel({ label, collapsed, color, variant, style, testID }: {
  label: string;
  collapsed: boolean;
  color: string;
  variant: TypeScaleVariant;
  style?: StyleProp<TextStyle>;
  testID?: string;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(Number(collapsed));
  const naturalWidth = useSharedValue(0);
  useEffect(() => {
    progress.value = reducedMotion ? Number(collapsed) : withTiming(Number(collapsed), {
      duration: animation.duration.slow, easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [collapsed, progress, reducedMotion]);
  const animated = useAnimatedStyle(() => ({
    width: naturalWidth.value > 0 ? naturalWidth.value * (1 - progress.value) : progress.value === 1 ? 0 : undefined,
    opacity: 1 - progress.value,
  }), [naturalWidth, progress]);
  return <Animated.View testID={testID} aria-hidden={collapsed} accessibilityElementsHidden={collapsed}
    importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'}
    style={[{ overflow: 'hidden', flexShrink: 1 }, animated]}>
    <View onLayout={event => { naturalWidth.value = event.nativeEvent.layout.width; }}
      style={{ flexDirection: 'row', alignSelf: 'flex-start', flexShrink: 0, paddingLeft: 8 }}>
      <Text variant={variant} numberOfLines={1} style={[{ color }, style]}>{label}</Text>
    </View>
  </Animated.View>;
}
