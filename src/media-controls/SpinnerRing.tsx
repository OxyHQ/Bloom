import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * A ring with one bright quarter, turning once every 800ms. Internal to the
 * family (`PlayButton`'s `loading`). It keeps turning under reduced motion: it
 * is a status, not decoration, and a still ring would read as "stalled".
 */
export function SpinnerRing({ size, color }: { size: number; color: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const animated = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );

  const stroke = Math.max(2, Math.round(size / 10));
  const ring = { width: size, height: size, borderRadius: size / 2, borderWidth: stroke } as const;
  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      {/* The track: the whole ring, faint. Opacity rather than an alpha colour. */}
      <View style={[ring, { position: 'absolute', borderColor: color, opacity: 0.3 }]} />
      <Animated.View
        style={[
          ring,
          {
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: color,
          },
          animated,
        ]}
      />
    </View>
  );
}
