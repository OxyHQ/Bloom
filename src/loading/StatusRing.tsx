import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCloseCircleFill } from '../icons/remix/RiCloseCircleFill';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useTheme } from '../theme/use-theme';
import { SpinnerRing } from './SpinnerRing';

export interface StatusRingProps {
  state: 'idle' | 'loading' | 'success' | 'error';
  /** Static centre artwork. The host keeps ownership of its brand asset. */
  children: ReactNode;
  size?: number;
  /** Localized status, announced without exposing duplicate decorative children. */
  accessibilityLabel: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** A controlled status around static artwork. No timers, completion callbacks or domain state. */
export function StatusRing({
  state,
  children,
  size = 48,
  accessibilityLabel,
  testID,
  style,
}: StatusRingProps) {
  const { colors } = useTheme();
  const reduced = usePrefersReducedMotion();
  const complete = useSharedValue(state === 'success' ? 1 : 0);
  useEffect(() => {
    const target = state === 'success' ? 1 : 0;
    complete.value = reduced ? target : withTiming(target, { duration: 180 });
    return () => cancelAnimation(complete);
  }, [complete, reduced, state]);
  const tickStyle = useAnimatedStyle(
    () => ({
      opacity: complete.value,
      transform: [{ scale: 0.8 + complete.value * 0.2 }],
    }),
    [complete],
  );
  const brandStyle = useAnimatedStyle(() => ({ opacity: 1 - complete.value }), [complete]);
  const color =
    state === 'success' ? colors.success : state === 'error' ? colors.error : colors.primary;
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole={state === 'loading' ? 'progressbar' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: state === 'loading' }}
      accessibilityLiveRegion="polite"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: state === 'idle' ? 'transparent' : colors.background,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        {state === 'loading' ? (
          <SpinnerRing size={size} color={color} strokeWidth={2} animated={!reduced} />
        ) : state !== 'idle' ? (
          <View
            testID="bloom-status-ring-track"
            style={[
              StyleSheet.absoluteFill,
              {
                borderWidth: 2,
                borderRadius: size / 2,
                borderColor: color,
              },
            ]}
          />
        ) : null}
        <Animated.View testID="bloom-status-ring-brand" style={[styles.center, brandStyle]}>
          {children}
        </Animated.View>
        <Animated.View testID="bloom-status-ring-tick" style={[styles.center, tickStyle]}>
          <RiCheckLine size="lg" fill={colors.success} />
        </Animated.View>
        {state === 'error' && (
          <View style={[styles.badge, { backgroundColor: colors.background }]}>
            <RiCloseCircleFill size="sm" fill={colors.error} />
          </View>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -2, bottom: -2, borderRadius: 9999 },
});
