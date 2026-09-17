import React, { memo, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Mask, Rect, Stop } from 'react-native-svg';

import { Button, CloseButton } from '../button';
import { ACCENT_TABLE, colorRamp, resolveButtonRamps } from '../button/shared';
import { BREAKPOINTS } from '../styles/breakpoints';
import { WEB_POSITION_FIXED, type WebCssStyle } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { ProOfferCardProps } from './types';

/**
 * `ProOfferCard`: the upgrade prompt anchored
 * bottom-left of the app.
 *
 *   card       280 wide (full width minus 12 each side under `sm`), 12 from
 *              the bottom-left, radius 16, 1px border-button-white,
 *              background-secondary, p16, gap 12, shadow-waitlist
 *   backdrop   a light band across the top (default: accent-200 → accent-100 →
 *              clear, diagonal, 70%), masked from opaque at 38% to clear
 *   copy       mark, then title body-medium / description body-2-regular
 *              secondary, 4 apart
 *   cta        full-width button with a white 40% shimmer sweeping across it
 *              every 2.5s (skewed −12°), hidden under reduced motion
 *   close      xs close button 12 from the top-right
 *   enter      fades up 16px over 300ms after a 1.2s delay
 *
 * No shader backdrop ships by default; pass your own
 * `backdrop` node (masked the same way on web).
 */

const IS_WEB = Platform.OS === 'web';
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

/** `--shadow-waitlist`, light and dark. */
const WAITLIST_SHADOW = {
  light:
    '0 0 6px 0 rgba(0, 0, 0, 0.06), 0 0 64px 0 rgba(0, 0, 0, 0.16), 0 0 1px 0 rgba(0, 0, 0, 0.32), 0 1px 12px 0 rgba(0, 0, 0, 0.06), 0 1px 0 0 rgba(0, 0, 0, 0.02)',
  dark:
    '0 0 6px 0 rgba(0, 0, 0, 0.12), 0 0 64px 0 rgba(0, 0, 0, 0.22), 0 0 1px 0 rgba(0, 0, 0, 0.42), 0 1px 12px 0 rgba(0, 0, 0, 0.14), 0 1px 0 0 rgba(0, 0, 0, 0.08)',
} as const;

let ids = 0;

function DefaultBackdrop({ from, via }: { from: string; via: string }) {
  const id = useMemo(() => `bloom-pro-offer-${ids++}`, []);
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} stopOpacity={0.7} />
          <Stop offset="0.5" stopColor={via} stopOpacity={0.7} />
          <Stop offset="1" stopColor={via} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.38" stopColor="#ffffff" stopOpacity={1} />
          <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
        <Mask id={`${id}-mask`}>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}-fade)`} />
        </Mask>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}-fill)`} mask={`url(#${id}-mask)`} />
    </Svg>
  );
}

function Shimmer({ width }: { width: number }) {
  const reducedMotion = useReducedMotion();
  const travel = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion || width === 0) return;
    // 0–40% of 2.5s travels, the rest rests.
    travel.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000, easing: EASE_IN_OUT }), withDelay(1500, withTiming(1, { duration: 0 })), withTiming(0, { duration: 0 })),
      -1,
    );
  }, [reducedMotion, width, travel]);
  const barWidth = width * 0.45;
  const style = useAnimatedStyle(
    () => ({ transform: [{ translateX: travel.value * barWidth * 3.5 }, { skewX: '-12deg' }] }),
    [travel, barWidth],
  );
  if (reducedMotion || width === 0) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, bottom: 0, left: -width * 0.55, width: barWidth }, style]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="bloom-pro-offer-shimmer" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0.4} />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bloom-pro-offer-shimmer)" />
      </Svg>
    </Animated.View>
  );
}

const ProOfferCardComponent: React.FC<ProOfferCardProps> = ({
  title,
  description,
  ctaLabel,
  onCtaPress,
  onDismiss,
  logo,
  backdrop,
  backdropHeight = 120,
  accessibilityLabel = 'Pro offer',
  dismissLabel = 'Dismiss',
  placement = 'fixed',
  enterDelay = 1200,
  style,
  testID,
}) => {
  const theme = useTheme();
  const { width: viewport } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [ctaWidth, setCtaWidth] = useState(0);
  const palette = useMemo(() => {
    const { neutral: n } = resolveButtonRamps(theme);
    const accent = colorRamp(theme.colors.primary, ACCENT_TABLE);
    return {
      surface: theme.isDark ? n[900] : n[100],
      border: theme.isDark ? n[800] : theme.colors.card,
      shadow: theme.isDark ? WAITLIST_SHADOW.dark : WAITLIST_SHADOW.light,
      from: accent[200],
      via: accent[100],
      text: theme.colors.text,
      secondary: n[500],
    };
  }, [theme]);

  const enter = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    enter.value = reducedMotion ? 1 : withDelay(enterDelay, withTiming(1, { duration: 300, easing: EASE_OUT }));
  }, [enter, enterDelay, reducedMotion]);
  const enterStyle = useAnimatedStyle(
    () => ({ opacity: enter.value, transform: [{ translateY: (1 - enter.value) * 16 }] }),
    [enter],
  );

  const narrow = viewport < BREAKPOINTS.sm;
  const position: ViewStyle =
    placement === 'fixed'
      ? {
          position: IS_WEB ? WEB_POSITION_FIXED : 'absolute',
          bottom: 12,
          left: 12,
          ...(narrow ? { right: 12 } : { width: 280 }),
          zIndex: Z_INDEX.floating,
        }
      : { width: 280 };

  const backdropStyle: WebCssStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: backdropHeight,
    overflow: 'hidden',
    ...(IS_WEB && backdrop
      ? {
          maskImage: 'linear-gradient(to bottom, #000 38%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 38%, transparent 100%)',
        }
      : null),
  };

  return (
    <Animated.View
      role="complementary"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        position,
        {
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 12,
          overflow: 'hidden',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surface,
          padding: 16,
          boxShadow: palette.shadow,
        },
        enterStyle,
        style,
      ]}
    >
      <View aria-hidden pointerEvents="none" style={backdropStyle}>
        {backdrop ?? <DefaultBackdrop from={palette.from} via={palette.via} />}
      </View>
      {logo ? <View style={{ flexShrink: 0 }}>{logo}</View> : null}
      <View style={{ minWidth: 0, gap: 4 }}>
        <Text variant="body-medium" style={{ color: palette.text }}>
          {title}
        </Text>
        <Text variant="body-2-regular" style={{ color: palette.secondary }}>
          {description}
        </Text>
      </View>
      <View
        style={{ width: '100%' }}
        onLayout={(event: LayoutChangeEvent) => setCtaWidth(event.nativeEvent.layout.width)}
      >
        <Button variant="primary" size="medium" fullWidth style={{ width: '100%' }} onPress={onCtaPress}>
          {ctaLabel}
        </Button>
        <View
          aria-hidden
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: 9999 }}
        >
          <Shimmer width={ctaWidth} />
        </View>
      </View>
      <CloseButton
        size="xs"
        accessibilityLabel={dismissLabel}
        onPress={onDismiss}
        style={{ position: 'absolute', top: 12, right: 12, zIndex: Z_INDEX.raised }}
        testID={testID ? `${testID}-dismiss` : undefined}
      />
    </Animated.View>
  );
};

export const ProOfferCard = memo(ProOfferCardComponent);
ProOfferCard.displayName = 'ProOfferCard';
