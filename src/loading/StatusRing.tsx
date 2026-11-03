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
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useTheme } from '../theme/use-theme';
import { SpinnerRing } from './SpinnerRing';

export interface StatusRingProps {
  state: 'idle' | 'loading' | 'success' | 'error';
  /** Brand artwork, crossfaded with status layers. The host owns the asset. */
  children: ReactNode;
  size?: number;
  /** Localized status, announced without exposing duplicate decorative children. */
  accessibilityLabel: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** A controlled crossfade between artwork and status. No timers, completion callbacks or domain state. */
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
  const brand = useSharedValue(state === 'idle' ? 1 : 0);
  const loading = useSharedValue(state === 'loading' ? 1 : 0);
  const complete = useSharedValue(state === 'success' ? 1 : 0);
  const error = useSharedValue(state === 'error' ? 1 : 0);
  useEffect(() => {
    const transition = (target: number) =>
      reduced ? target : withTiming(target, { duration: 220 });
    brand.value = transition(state === 'idle' ? 1 : 0);
    loading.value = transition(state === 'loading' ? 1 : 0);
    complete.value = transition(state === 'success' ? 1 : 0);
    error.value = transition(state === 'error' ? 1 : 0);
    return () => {
      cancelAnimation(brand);
      cancelAnimation(loading);
      cancelAnimation(complete);
      cancelAnimation(error);
    };
  }, [brand, loading, complete, error, reduced, state]);
  const tickStyle = useAnimatedStyle(
    () => ({
      opacity: complete.value,
      transform: [{ scale: 0.8 + complete.value * 0.2 }],
    }),
    [complete],
  );
  const spinnerStyle = useAnimatedStyle(
    () => ({
      opacity: loading.value,
      transform: [{ scale: 0.8 + loading.value * 0.2 }],
    }),
    [loading],
  );
  const brandStyle = useAnimatedStyle(
    () => ({
      opacity: brand.value,
      transform: [{ scale: 0.75 + brand.value * 0.25 }],
    }),
    [brand],
  );
  const errorStyle = useAnimatedStyle(
    () => ({ opacity: error.value, transform: [{ scale: 0.8 + error.value * 0.2 }] }),
    [error],
  );
  const backgroundStyle = useAnimatedStyle(
    () => ({
      opacity: 1 - brand.value,
    }),
    [brand],
  );
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
          backgroundColor: 'transparent',
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
        <Animated.View
          testID="bloom-status-ring-background"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: size / 2, backgroundColor: colors.background },
            backgroundStyle,
          ]}
        />
        <Animated.View
          testID="bloom-status-ring-spinner"
          style={[StyleSheet.absoluteFill, spinnerStyle]}
        >
          <SpinnerRing
            size={size}
            color={colors.primary}
            strokeWidth={2}
            animated={state === 'loading' && !reduced}
          />
        </Animated.View>
        <Animated.View testID="bloom-status-ring-brand" style={[styles.center, brandStyle]}>
          {children}
        </Animated.View>
        <Animated.View testID="bloom-status-ring-tick" style={[styles.center, tickStyle]}>
          <RiCheckLine size="lg" fill={colors.success} />
        </Animated.View>
        <Animated.View testID="bloom-status-ring-error" style={[styles.center, errorStyle]}>
          <RiCloseLine size="lg" fill={colors.error} />
        </Animated.View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
