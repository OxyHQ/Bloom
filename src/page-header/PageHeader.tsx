import React, { memo, useContext, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { Button } from '../button';
import { BUTTON_SHADOW, mixColor, resolveButtonRamps } from '../button/shared';
import { RiArrowLeftLine } from '../icons/remix';
import { BREAKPOINTS } from '../styles/breakpoints';
import { WEB_POSITION_STICKY, type WebCssStyle } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { PageHeaderProps } from './types';

/**
 * `PageHeader`: a screen's top bar — back button, title (+ subtitle), leading
 * node and actions, composed from the vocabulary Bloom's template headers and
 * the settings modal's compact header use:
 *
 *   bar         min-height 56, side inset 16 (below `sm`) / 24, gap 8
 *   back        secondary medium icon button (36, pill, shadow-xs), RiArrowLeftLine 20
 *   start group gap 6 (template header `gap-1.5`)
 *   title       headline-medium, text-primary, px 4 (template `px-1`), one line
 *   subtitle    body-2-regular, text-secondary (neutral-500), one line
 *   actions     gap 10 (template `gap-2.5`)
 *   background  background/full — card / dark neutral-925
 *   separator   1px separator-border — neutral-200 / dark neutral-800
 *   shadow      shadow-xs, fading in with scroll
 *
 * Scroll-linked, not timed: border (`auto`), background (`transparent`) and
 * shadow (and, when `transparent`, the title) interpolate over `[0, scrollThreshold]` of `scrollY` — the caller's
 * shared value, else `window.scrollY` on web. No press scale.
 */

const BAR_HEIGHT = 56;
const INSET_COMPACT = 16;
const INSET_WIDE = 24;
const START_GAP = 6;
const ROW_GAP = 8;
const ACTIONS_GAP = 10;
const TITLE_PADDING = 4;
const DEFAULT_THRESHOLD = 20;

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

function PageHeaderComponent({
  title,
  subtitle,
  titleAlign = 'start',
  headingLevel = 1,
  onBack,
  backLabel = 'Back',
  leading,
  actions,
  border = 'auto',
  transparent = false,
  scrollY: externalScrollY,
  scrollThreshold = DEFAULT_THRESHOLD,
  sticky = true,
  safeArea,
  style,
  testID,
}: PageHeaderProps) {
  const isWeb = Platform.OS === 'web';
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS;
  const padTop = (safeArea ?? !isWeb) ? insets.top : 0;
  const sideInset = width >= BREAKPOINTS.sm ? INSET_WIDE : INSET_COMPACT;

  const paint = useMemo(() => {
    const { neutral } = resolveButtonRamps(theme);
    return theme.isDark
      ? {
          background: mixColor(neutral[900], neutral[950], 0.4),
          separator: neutral[800],
          textSecondary: neutral[500],
          shadow: BUTTON_SHADOW.dark,
        }
      : {
          background: theme.colors.card,
          separator: neutral[200],
          textSecondary: neutral[500],
          shadow: BUTTON_SHADOW.light,
        };
  }, [theme]);

  const internalScrollY = useSharedValue(0);
  const scrollY = externalScrollY ?? internalScrollY;

  // Web fallback: the document is the scroll owner, as in the fleet headers.
  useEffect(() => {
    if (!isWeb || externalScrollY || typeof window === 'undefined') return undefined;
    const onScroll = () => {
      internalScrollY.value = window.scrollY;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isWeb, externalScrollY, internalScrollY]);

  const threshold = Math.max(1, scrollThreshold);

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }), [scrollY, threshold]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: transparent
      ? interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP)
      : 1,
  }), [scrollY, threshold, transparent]);

  // Over media the title would sit on the photo; it arrives with the bar.
  const titleStyle = useAnimatedStyle(() => ({
    opacity: transparent
      ? interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP)
      : 1,
  }), [scrollY, threshold, transparent]);

  const borderStyle = useAnimatedStyle(() => ({
    opacity:
      border === 'always'
        ? 1
        : border === 'none'
          ? 0
          : interpolate(scrollY.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }), [scrollY, threshold, border]);

  // Centred title: inset it by the wider side so it sits on the bar's centre
  // whatever the two sides hold.
  const [startWidth, setStartWidth] = useState(0);
  const [endWidth, setEndWidth] = useState(0);
  const centered = titleAlign === 'center';
  const onStartLayout = (e: LayoutChangeEvent) => setStartWidth(e.nativeEvent.layout.width);
  const onEndLayout = (e: LayoutChangeEvent) => setEndWidth(e.nativeEvent.layout.width);
  const centerInset = Math.max(startWidth, endWidth) + ROW_GAP;

  const titleBlock =
    title != null || subtitle != null ? (
      <Animated.View
        style={[
          styles.titleBlock,
          centered ? styles.titleBlockCentered : styles.titleBlockStart,
          titleStyle,
        ]}
        testID={testID ? `${testID}-title-block` : undefined}
      >
        {typeof title === 'string' || typeof title === 'number' ? (
          <Text
            role="heading"
            aria-level={headingLevel}
            variant="headline-medium"
            numberOfLines={1}
            style={{ color: theme.colors.text, textAlign: centered ? 'center' : 'left' }}
            testID={testID ? `${testID}-title` : undefined}
          >
            {title}
          </Text>
        ) : (
          title
        )}
        {typeof subtitle === 'string' || typeof subtitle === 'number' ? (
          <Text
            variant="body-2-regular"
            numberOfLines={1}
            style={{ color: paint.textSecondary, textAlign: centered ? 'center' : 'left' }}
            testID={testID ? `${testID}-subtitle` : undefined}
          >
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
      </Animated.View>
    ) : null;

  const containerWeb: WebCssStyle | null =
    isWeb && sticky ? { position: WEB_POSITION_STICKY, top: 0, zIndex: Z_INDEX.floating } : null;

  return (
    <View
      testID={testID}
      style={[styles.container, { paddingTop: padTop }, containerWeb, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { boxShadow: paint.shadow }, shadowStyle]}
        testID={testID ? `${testID}-shadow` : undefined}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: paint.background }, backgroundStyle]}
        testID={testID ? `${testID}-background` : undefined}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.border, { backgroundColor: paint.separator }, borderStyle]}
        testID={testID ? `${testID}-border` : undefined}
      />
      <View
        style={[styles.bar, { paddingLeft: sideInset, paddingRight: sideInset }]}
        testID={testID ? `${testID}-bar` : undefined}
      >
        <View
          style={[styles.start, !centered && styles.startFill]}
          onLayout={centered ? onStartLayout : undefined}
          testID={testID ? `${testID}-start` : undefined}
        >
          {onBack ? (
            <Button
              variant="secondary"
              size="medium"
              iconOnly
              leadingIcon={RiArrowLeftLine}
              accessibilityLabel={backLabel}
              onPress={onBack}
              testID={testID ? `${testID}-back` : undefined}
            />
          ) : null}
          {leading}
          {centered ? null : titleBlock}
        </View>
        {centered ? <View style={styles.spacer} /> : null}
        {actions ? (
          <View
            style={styles.actions}
            onLayout={centered ? onEndLayout : undefined}
            testID={testID ? `${testID}-actions` : undefined}
          >
            {actions}
          </View>
        ) : null}
        {centered && titleBlock ? (
          <View
            pointerEvents="box-none"
            style={[styles.centerSlot, { left: sideInset + centerInset, right: sideInset + centerInset }]}
            testID={testID ? `${testID}-center` : undefined}
          >
            {titleBlock}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  border: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
  bar: {
    minHeight: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ROW_GAP,
    paddingTop: 8,
    paddingBottom: 8,
  },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: START_GAP,
    minWidth: 0,
  },
  startFill: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  titleBlock: {
    minWidth: 0,
    paddingLeft: TITLE_PADDING,
    paddingRight: TITLE_PADDING,
  },
  titleBlockStart: {
    flex: 1,
  },
  titleBlockCentered: {
    alignItems: 'center',
  },
  centerSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: ACTIONS_GAP,
    flexShrink: 0,
  },
});

export const PageHeader = memo(PageHeaderComponent);
PageHeader.displayName = 'PageHeader';
