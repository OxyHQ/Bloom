import React, { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text, typeScale } from '../typography';
import { useTheme } from '../theme/use-theme';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useResolvedBloomLocale } from '../locale/context';
import { formatCurrency } from '../locale/format-number';
import { RollingText } from '../motion/RollingText';
import type { SubscriptionPriceValue } from './types';

const priceScale = typeScale('title-2-regular');
/** Localized numeric price with a single accessible reading and decorative rolling digits. */
export function SubscriptionPrice({
  amount,
  currency,
  locale,
  suffix,
  description,
}: SubscriptionPriceValue) {
  const theme = useTheme();
  const reduced = usePrefersReducedMotion();
  // The price's own locale, else the app's (`BloomProvider locale`).
  const resolvedLocale = useResolvedBloomLocale(locale);
  const formatted = formatCurrency(amount, currency, resolvedLocale, 'currency');
  const accessibleAmount = [formatted, suffix].filter(Boolean).join(' ');
  const copyOpacity = useSharedValue(1);
  useLayoutEffect(() => {
    cancelAnimation(copyOpacity);
    if (reduced) {
      copyOpacity.value = 1;
      return;
    }
    copyOpacity.value = 0;
    copyOpacity.value = withTiming(1, { duration: 300 });
  }, [suffix, description, reduced, copyOpacity]);
  const copyStyle = useAnimatedStyle(() => ({ opacity: copyOpacity.value }), [copyOpacity]);
  return (
    <View style={styles.root}>
      <View accessible accessibilityLabel={accessibleAmount} accessibilityLiveRegion="polite">
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.amount}
        >
          <RollingText mode="digits" value={formatted} style={priceScale} />
          {suffix ? (
            <Animated.View style={copyStyle}>
              <Text style={priceScale}>{suffix}</Text>
            </Animated.View>
          ) : null}
        </View>
      </View>
      {description ? (
        <Animated.View style={copyStyle}>
          <Text
            variant="body-2-regular"
            style={[styles.description, { color: theme.colors.textSecondary }]}
          >
            {description}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 6 },
  amount: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  description: { textAlign: 'center' },
});
