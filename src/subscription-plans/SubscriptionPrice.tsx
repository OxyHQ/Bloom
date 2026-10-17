import React, { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text, typeScale } from '../typography';
import { useTheme } from '../theme/use-theme';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import type { SubscriptionPriceValue } from './types';

const priceScale = typeScale('title-2-regular');
const digits = '0123456789'.split('');

function PriceDigit({ digit, reduced }: { digit: number; reduced: boolean }) {
  const offset = useSharedValue(-digit * priceScale.lineHeight);
  useLayoutEffect(() => {
    cancelAnimation(offset);
    const target = -digit * priceScale.lineHeight;
    offset.value = reduced
      ? target
      : withTiming(target, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, [digit, reduced, offset]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  return (
    <View style={styles.digit}>
      <Animated.View style={motion}>
        {digits.map((value) => (
          <Text key={value} style={styles.digitText}>
            {value}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

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
  const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
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
  const copyStyle = useAnimatedStyle(() => ({ opacity: copyOpacity.value }));
  return (
    <View style={styles.root}>
      <View accessible accessibilityLabel={accessibleAmount} accessibilityLiveRegion="polite">
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.amount}
        >
          <View style={styles.number}>
            {Array.from(formatted).map((char, index, chars) =>
              /[0-9]/.test(char) ? (
                <PriceDigit
                  key={`${chars.length - index}-digit`}
                  digit={Number(char)}
                  reduced={reduced}
                />
              ) : (
                <Text key={`${chars.length - index}-literal`} style={priceScale}>
                  {char}
                </Text>
              ),
            )}
          </View>
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
  number: { flexDirection: 'row', alignItems: 'flex-start' },
  digit: { height: priceScale.lineHeight, width: priceScale.fontSize * 0.65, overflow: 'hidden' },
  digitText: { ...priceScale, textAlign: 'center', fontVariant: ['tabular-nums'] },
  description: { textAlign: 'center' },
});
