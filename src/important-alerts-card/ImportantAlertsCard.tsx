import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { BUTTON_SHADOW } from '../button/shared';
import { resolveDashboardSurfaces, toneColor, type DashboardSurfaces } from '../stat-cards/tones';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type {
  ImportantAlertsCardAlert,
  ImportantAlertsCardProps,
  ImportantAlertsCardTone,
} from './types';

/**
 * The important alerts card. Geometry, to the pixel:
 *
 *   card     330 tall, radius 20, 1px border in the card's OWN colour (content
 *            clips inside it, so a scrolled row stops 1px shy of the rounded
 *            edge), padding 10 top and sides, NONE at the bottom — the feed
 *            runs flush to the edge and clips there; 16 between header and feed
 *   header   padding 6 top and sides; title 14/20 medium, 2, count 24/34
 *            medium tabular + 4 + caption 12/16 medium (baseline-aligned);
 *            range pill 151 × 32, radius 10, 1px border, `shadow-xs`,
 *            padding 4, chevrons 16
 *   feed     rows 10 apart, 10 of padding after the last one
 *   row      radius 10, padding 10, 8 between icon and text;
 *            icon circle 32 with an 18px white glyph;
 *            title 14/20 medium (one line), description 13/18 regular, 2 apart;
 *            date pill pinned 10/10 from the top-right: radius 6, padding 1 / 6,
 *            14/20 medium
 *   fade     40 tall, the card colour → transparent over the feed's top edge,
 *            opacity 0 → 1 over 200ms ease-out once the feed is scrolled
 */

const IS_WEB = Platform.OS === 'web';
const CARD_HEIGHT = 330;
const FADE_HEIGHT = 40;
const FADE_MS = 200;
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

const STYLE_ID = 'bloom-important-alerts-card-web-css';
/** `overscroll-contain`: the feed's scroll never chains to the page. */
const ALERTS_CSS = '[data-bloom-alerts-feed] { overscroll-behavior: contain; }';

type WebDataSet = { dataSet?: Record<string, string> };

/** `bg-<tone>-<stop>` per icon circle. */
const TONE_STOPS: Record<ImportantAlertsCardTone, 400 | 500 | 600> = {
  rose: 600,
  amber: 400,
  emerald: 500,
  blue: 400,
  purple: 400,
  teal: 400,
};

function iconBackgroundFor(theme: Theme, alert: ImportantAlertsCardAlert): string {
  if (alert.iconBackground) return alert.iconBackground;
  const tone = alert.tone ?? 'blue';
  return toneColor(theme, tone, TONE_STOPS[tone]);
}

const CHEVRON_LEFT = 'M9 4L5.70711 7.29289C5.31658 7.68342 5.31658 8.31658 5.70711 8.70711L9 12';
const CHEVRON_RIGHT = 'M7 4L10.2929 7.29289C10.6834 7.68342 10.6834 8.31658 10.2929 8.70711L7 12';

function Chevron16({ d, color }: { d: string; color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d={d} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** The static `WeekRangePill`: decorative chevrons around a range label. */
function RangePill({
  label,
  surfaces,
  isDark,
  testID,
}: {
  label: string;
  surfaces: DashboardSurfaces;
  isDark: boolean;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={[
        styles.rangePill,
        {
          borderColor: surfaces.buttonBorder,
          backgroundColor: surfaces.primary,
          boxShadow: BUTTON_SHADOW[isDark ? 'dark' : 'light'],
        },
      ]}
    >
      <View style={styles.chevron} aria-hidden>
        <Chevron16 d={CHEVRON_LEFT} color={surfaces.textSecondary} />
      </View>
      <Text
        variant="body-medium"
        numberOfLines={1}
        style={[styles.rangeLabel, { color: surfaces.text }]}
      >
        {label}
      </Text>
      <View style={styles.chevron} aria-hidden>
        <Chevron16 d={CHEVRON_RIGHT} color={surfaces.textSecondary} />
      </View>
    </View>
  );
}

let fadeIdCounter = 0;

function TopFade({ color, visible }: { color: string; visible: boolean }) {
  const id = useMemo(() => `bloom-alerts-fade${fadeIdCounter++}`, []);
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    const target = visible ? 1 : 0;
    opacity.value = reducedMotion ? target : withTiming(target, { duration: FADE_MS, easing: EASE_OUT });
  }, [visible, reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);

  return (
    <Animated.View pointerEvents="none" aria-hidden style={[styles.fade, animatedStyle]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            {/* Transparency through `stopOpacity`: react-native-svg drops alpha in `stopColor`. */}
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

function ImportantAlertsCardComponent({
  alerts,
  count,
  title = 'Important alerts',
  countCaption = 'this week',
  rangeLabel,
  height = CARD_HEIGHT,
  style,
  testID,
}: ImportantAlertsCardProps) {
  const theme = useTheme();
  const surfaces = useMemo(() => resolveDashboardSurfaces(theme), [theme]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, ALERTS_CSS);
  }, []);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = event.nativeEvent.contentOffset.y > 0;
    setScrolled((current) => (current === next ? current : next));
  };

  const feedHook: WebDataSet = IS_WEB ? { dataSet: { bloomAlertsFeed: '' } } : {};

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { height, backgroundColor: surfaces.secondary, borderColor: surfaces.secondary },
        style,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headline}>
          <Text variant="body-medium" style={{ color: surfaces.textSecondary }}>
            {title}
          </Text>
          <View style={styles.countRow}>
            <Text
              variant="title-1-medium"
              numberOfLines={1}
              style={[styles.tabular, { color: surfaces.text }]}
            >
              {count}
            </Text>
            <Text
              variant="caption-1-medium"
              numberOfLines={1}
              style={{ color: surfaces.textSecondary }}
            >
              {countCaption}
            </Text>
          </View>
        </View>
        {rangeLabel != null ? (
          <RangePill
            label={rangeLabel}
            surfaces={surfaces}
            isDark={theme.isDark}
            testID={testID ? `${testID}-range` : undefined}
          />
        ) : null}
      </View>

      <View style={styles.feedFrame}>
        <ScrollView
          {...feedHook}
          testID={testID ? `${testID}-feed` : undefined}
          style={styles.feed}
          contentContainerStyle={styles.feedContent}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <View
                key={alert.id ?? `${alert.title}-${index}`}
                testID={testID ? `${testID}-alert-${index}` : undefined}
                style={[styles.alert, { backgroundColor: surfaces.inner }]}
              >
                <View
                  testID={testID ? `${testID}-icon-${index}` : undefined}
                  style={[styles.iconCircle, { backgroundColor: iconBackgroundFor(theme, alert) }]}
                >
                  <Icon width={18} height={18} fill="#fff" />
                </View>
                <View style={styles.alertText}>
                  <Text variant="body-medium" numberOfLines={1} style={{ color: surfaces.text }}>
                    {alert.title}
                  </Text>
                  <Text variant="body-2-regular" style={{ color: surfaces.textSecondary }}>
                    {alert.description}
                  </Text>
                </View>
                <View
                  testID={testID ? `${testID}-date-${index}` : undefined}
                  style={[styles.datePill, { backgroundColor: surfaces.secondary }]}
                >
                  <Text
                    variant="body-medium"
                    numberOfLines={1}
                    style={{ color: surfaces.textSecondary }}
                  >
                    {alert.date}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
        <TopFade color={surfaces.secondary} visible={scrolled} />
      </View>
    </View>
  );
}

export const ImportantAlertsCard = memo(ImportantAlertsCardComponent);
ImportantAlertsCard.displayName = 'ImportantAlertsCard';

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 0,
    gap: 16,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 6,
    paddingLeft: 6,
    paddingRight: 6,
  },
  headline: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, gap: 2 },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  tabular: { fontVariant: ['tabular-nums'] },
  rangePill: {
    width: 151,
    height: 32,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 4,
  },
  chevron: { width: 16, height: 16, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  rangeLabel: { flexGrow: 1, flexShrink: 1, flexBasis: 0, textAlign: 'center' },
  feedFrame: { position: 'relative', flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0, width: '100%' },
  feed: { width: '100%', height: '100%' },
  feedContent: { gap: 10, paddingBottom: 10 },
  alert: {
    position: 'relative',
    width: '100%',
    flexShrink: 0,
    gap: 8,
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: { gap: 2 },
  datePill: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 6,
    paddingTop: 1,
    paddingBottom: 1,
    paddingLeft: 6,
    paddingRight: 6,
  },
  fade: { position: 'absolute', left: 0, right: 0, top: 0, height: FADE_HEIGHT },
});
