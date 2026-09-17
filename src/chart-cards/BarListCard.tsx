import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { mixColor } from '../button/shared';
import { RiArrowDownSLine } from '../icons/remix';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Tabs, TabsTrigger } from '../tabs';
import { Text } from '../typography';
import { resolveTone, type ChartSeriesTone } from './palette';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { TABULAR } from './primitives/ChartHeader';
import { groupThousands } from './primitives/format';
import { useChartCardPalette, useChartTones, useMonoTone } from './primitives/use-chart-palette';
import { useWebTransition } from './primitives/use-web-transition';
import { useChartFocusRing, useMedicalPalette } from './medical-parts';
import {
  hoverTarget,
  renderChartIcon,
  useGrowWidth,
  useMountedAfterDelay,
  type ChartIcon,
} from './stage-parts';

/**
 * `BarListCard`: the analytics breakdown list (traffic by country, device,
 * browser…).
 *
 *   card     `background-secondary`, radius 16, padding 4 top / 16 sides / 12
 *            bottom, content-sized
 *   header   a rule edge to edge (1px `separator-border`, the row pulled 16px
 *            past the card padding and padded back): the underline `Tabs` strip
 *            (or, for one list, its title `body-medium` px 10 py 8) on the left,
 *            the metric caption on the right (`caption-1-medium` 0.06em tracking,
 *            uppercase, text-tertiary, 10px above the rule). The strip scrolls
 *            when the tabs outgrow the card, fading whichever edge hides tabs
 *            (28px, web)
 *   rows     12px under the header, 4px apart, bleeding 8px past the card's
 *            sides and 4px into its bottom: 36 tall, radius 8, padding 10, a
 *            leading 16px icon 8px before the label (`body-regular`), the value
 *            (`body-medium` tabular) on the right. Behind them a bar as wide as
 *            the row's share of the TOP row, its colour at 14% (26% hovered),
 *            growing in over 500ms on mount
 *   more     past `limit` rows the list fades out over its last 44px behind a
 *            40 × 20 round pill (border-button, background-primary, shadow-xs,
 *            a 14px chevron that turns over 200ms); pressing it shows every row
 *            at once (the list's 4px tail eases in over 300ms) and the pill
 *            drops to 8px under the list
 *
 * Values print as share of the tab total (whole percents, `<0.5%` under half a
 * percent) or, with `metric="value"`, the raw value.
 */

export interface BarListItem {
  label: string;
  value: number;
  /** Any colour for this row's bar; defaults to the card `color`. */
  color?: string;
  /** Leading glyph in a 16px box: an icon component (tinted text-secondary) or a node. */
  icon?: ChartIcon;
}

export interface BarListTab {
  id: string;
  label: string;
  items: readonly BarListItem[];
}

export interface BarListCardProps {
  /** Tabbed lists. For a single list use `items` + `title`. */
  tabs?: readonly BarListTab[];
  items?: readonly BarListItem[];
  /** Heading of a single (untabbed) list. Default `"Breakdown"`. */
  title?: string;
  /** Column caption over the values. Default `"Visitors"`. */
  metricLabel?: string;
  /** Each row's share of the tab total (default) or its raw value. */
  metric?: 'share' | 'value';
  /** Raw values (`metric="value"`). Default en-US grouping. */
  format?: (value: number) => string;
  /** Bar tint; any colour. Default chart-6 (blue). */
  color?: string;
  /** Single-ink tint (mid grey on light, near-white on dark). */
  mono?: boolean;
  /** Rows shown before the "more" pill. Default 5. */
  limit?: number;
  /** Initially selected tab id (defaults to the first). */
  defaultTab?: string;
  onTabChange?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Whole percents, `<0.5%` for tiny slices, `0%` for zero. */
export function shareLabel(value: number, total: number): string {
  if (total <= 0 || value <= 0) return '0%';
  const pct = (value / total) * 100;
  if (pct < 0.5) return '<0.5%';
  return `${Math.round(pct)}%`;
}

const ROW_HEIGHT = 36;
const ROW_GAP = 4;
const FADE_HEIGHT = 44;
const STRIP_FADE = 28;
const REST_MS = 300;
/** motion `ease: [0.22, 1, 0.36, 1]`. */
const REST_EASE = Easing.bezier(0.22, 1, 0.36, 1);
/** `tracking-[0.06em]` on a 12px caption. */
const CAPTION_TRACKING = 0.72;

export function BarListCard({
  tabs,
  items,
  title,
  metricLabel = 'Visitors',
  metric = 'share',
  format = groupThousands,
  color,
  mono = false,
  limit = 5,
  defaultTab,
  onTabChange,
  style,
  testID,
}: BarListCardProps) {
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const monoTone = useMonoTone();
  const mounted = useMountedAfterDelay();
  // Palette index 1 is chart-6, blue.
  const tone = mono ? monoTone : resolveTone(palettes, 1, color);
  const lists: readonly BarListTab[] = tabs ?? [{ id: 'list', label: title ?? 'Breakdown', items: items ?? [] }];
  const [selectedId, setSelectedId] = useState<string>(defaultTab ?? lists[0]?.id ?? 'list');
  const single = lists.length === 1 && !tabs;
  const current = lists.find((l) => l.id === selectedId) ?? lists[0];

  const caption = (
    <Text
      variant="caption-1-medium"
      numberOfLines={1}
      style={{ flexShrink: 0, paddingBottom: 10, letterSpacing: CAPTION_TRACKING, textTransform: 'uppercase', color: palette.textTertiary }}>
      {metricLabel}
    </Text>
  );

  const headerRow: ViewStyle = {
    marginLeft: -16,
    marginRight: -16,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.track,
  };

  return (
    <ChartCardSurface
      height="auto"
      gap={12}
      style={[{ width: '100%', paddingTop: 4 }, style]}
      testID={testID}>
      {single ? (
        <View style={headerRow} testID={testID ? `${testID}-header` : undefined}>
          <Text
            variant="body-medium"
            numberOfLines={1}
            style={{ flexShrink: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 8, paddingBottom: 8, color: palette.text }}>
            {current?.label}
          </Text>
          {caption}
        </View>
      ) : (
        <View style={headerRow} testID={testID ? `${testID}-header` : undefined}>
          <TabStrip
            lists={lists}
            value={current?.id ?? ''}
            onChange={(id) => {
              setSelectedId(id);
              onTabChange?.(id);
            }}
            testID={testID ? `${testID}-tabs` : undefined}
          />
          {caption}
        </View>
      )}
      {current ? (
        <BarRows
          key={current.id}
          items={current.items}
          metric={metric}
          format={format}
          tone={tone}
          mono={mono}
          limit={limit}
          mounted={mounted}
          testID={testID ? `${testID}-rows` : undefined}
        />
      ) : null}
    </ChartCardSurface>
  );
}

/**
 * The tab strip, scrolling inside the header. On web it fades whichever edge
 * still hides tabs (`mask-image`, 28px), re-measured on scroll and resize.
 */
function TabStrip({
  lists,
  value,
  onChange,
  testID,
}: {
  lists: readonly BarListTab[];
  value: string;
  onChange: (id: string) => void;
  testID?: string;
}) {
  const hostRef = useRef<View>(null);
  const [fades, setFades] = useState({ left: false, right: false });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const host = hostRef.current as unknown as HTMLElement | null;
    if (!host || typeof host.querySelectorAll !== 'function') return;
    const scroller = Array.from(host.querySelectorAll<HTMLElement>('*')).find((el) => {
      const overflow = getComputedStyle(el).overflowX;
      return overflow === 'auto' || overflow === 'scroll';
    });
    if (!scroller) return;
    const measure = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      const next = { left: scroller.scrollLeft > 1, right: max - scroller.scrollLeft > 1 };
      setFades((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
    };
    measure();
    scroller.addEventListener('scroll', measure, { passive: true });
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    ro?.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', measure);
      ro?.disconnect();
    };
  }, []);

  const mask =
    fades.left || fades.right
      ? `linear-gradient(to right, ${fades.left ? `transparent, black ${STRIP_FADE}px` : 'black'}, ${
          fades.right ? `black calc(100% - ${STRIP_FADE}px), transparent` : 'black'
        })`
      : undefined;
  const maskStyle: WebCssStyle | null = mask ? { maskImage: mask, WebkitMaskImage: mask } : null;

  return (
    <View ref={hostRef} style={[{ flex: 1, minWidth: 0 }, maskStyle]}>
      <Tabs variant="underline" value={value} onValueChange={onChange} style={{ borderBottomWidth: 0 }} testID={testID}>
        {lists.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} label={tab.label} />
        ))}
      </Tabs>
    </View>
  );
}

function BarRows({
  items,
  metric,
  format,
  tone,
  mono,
  limit,
  mounted,
  testID,
}: {
  items: readonly BarListItem[];
  metric: 'share' | 'value';
  format: (value: number) => string;
  tone: ChartSeriesTone;
  mono: boolean;
  limit: number;
  mounted: boolean;
  testID?: string;
}) {
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  const total = items.reduce((s, i) => s + i.value, 0);
  const top = Math.max(1, ...items.map((i) => i.value));
  const overflow = items.length > limit;
  // Once expanded, EVERY row moves into the one list at once, and the
  // animated block after it holds only its own 4px top padding.
  const visible = expanded || !overflow ? items : items.slice(0, limit);

  const row = (item: BarListItem, index: number) => {
    const itemTone = item.color && !mono ? resolveTone(palettes, index, item.color) : tone;
    return (
      <BarRow
        key={`${item.label}-${index}`}
        label={item.label}
        value={metric === 'share' ? shareLabel(item.value, total) : format(item.value)}
        percent={(item.value / top) * 100}
        tint={
          active === index
            ? mixColor(palette.surface, itemTone.activeColor, 0.26)
            : mixColor(palette.surface, itemTone.color, 0.14)
        }
        icon={renderChartIcon(item.icon, 16, palette.textSecondary)}
        mounted={mounted}
        hover={hoverTarget(index, setActive)}
        testID={testID ? `${testID}-row-${index}` : undefined}
      />
    );
  };

  return (
    <View testID={testID} style={{ position: 'relative', marginLeft: -8, marginRight: -8, marginBottom: -4, flexDirection: 'column' }}>
      <View style={{ flexDirection: 'column', gap: ROW_GAP }}>
        {visible.map((item, i) => row(item, i))}
        {overflow && !expanded ? <BottomFade color={palette.surface} /> : null}
      </View>
      {overflow ? <RestSpacer expanded={expanded} testID={testID ? `${testID}-rest` : undefined} /> : null}
      {overflow ? (
        <MoreButton
          expanded={expanded}
          hiddenCount={items.length - limit}
          onPress={() => setExpanded((v) => !v)}
          testID={testID ? `${testID}-more` : undefined}
        />
      ) : null}
    </View>
  );
}

function BarRow({
  label,
  value,
  percent,
  tint,
  icon,
  mounted,
  hover,
  testID,
}: {
  label: string;
  value: string;
  percent: number;
  tint: string;
  icon: React.ReactNode;
  mounted: boolean;
  hover: ReturnType<typeof hoverTarget>;
  testID?: string;
}) {
  const palette = useChartCardPalette();
  const width = useGrowWidth(percent, mounted);
  const colorEase = useWebTransition('background-color', 500);
  return (
    <View
      testID={testID}
      {...hover}
      style={{
        position: 'relative',
        height: ROW_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderRadius: 8,
        paddingLeft: 10,
        paddingRight: 10,
      }}>
      <Animated.View
        testID={testID ? `${testID}-bar` : undefined}
        style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width, borderRadius: 8, backgroundColor: tint }, colorEase]}
      />
      <View style={{ position: 'relative', minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? (
          <View style={{ width: 16, height: 16, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
        ) : null}
        <Text variant="body-regular" numberOfLines={1} style={{ flexShrink: 1, color: palette.text }}>
          {label}
        </Text>
      </View>
      <View style={{ position: 'relative', flexShrink: 0 }}>
        <Text variant="body-medium" numberOfLines={1} style={[{ color: palette.text }, TABULAR]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/**
 * The collapsed list masks to transparent over its last 44px. The card behind
 * it is one known colour, so a gradient of that colour lying over the rows
 * paints the same pixels — and works on native, which has no `mask-image`.
 */
function BottomFade({ color }: { color: string }) {
  // `useId` yields `«r0»` / `:r0:`, which a `url(#…)` cannot reference.
  const id = `bloom-barlist-fade-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: FADE_HEIGHT }}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * The block after the rows animates `height: 0 → auto` and opacity over
 * 300ms (`ease [0.22, 1, 0.36, 1]`) on expand, back on collapse.
 * By then every row already sits in the list above it, so all it holds is its
 * `pt-1` — the list grows 4px, smoothly, while the extra rows appear at once.
 */
function RestSpacer({ expanded, testID }: { expanded: boolean; testID?: string }) {
  const reducedMotion = useReducedMotion();
  const [present, setPresent] = useState(expanded);
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    if (expanded) setPresent(true);
    if (reducedMotion) {
      progress.setValue(expanded ? 1 : 0);
      if (!expanded) setPresent(false);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: REST_MS,
      easing: REST_EASE,
      useNativeDriver: false,
    });
    // `finished` is false when a newer toggle interrupted this one.
    animation.start((result) => {
      if (result?.finished !== false && !expanded) setPresent(false);
    });
    return () => animation.stop();
  }, [expanded, reducedMotion, progress]);

  if (!present) return null;
  return (
    <Animated.View
      testID={testID}
      style={{ overflow: 'hidden', height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, ROW_GAP] }), opacity: progress }}
    />
  );
}

function MoreButton({
  expanded,
  hiddenCount,
  onPress,
  testID,
}: {
  expanded: boolean;
  hiddenCount: number;
  onPress: () => void;
  testID?: string;
}) {
  const palette = useChartCardPalette();
  const medical = useMedicalPalette();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const { hook, ring } = useChartFocusRing('outset', medical.focusRing);
  const colorEase = useWebTransition('background-color', 150);
  const turn = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      turn.setValue(expanded ? 1 : 0);
      return;
    }
    const animation = Animated.timing(turn, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      easing: Easing.bezier(0, 0, 0.2, 1),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [expanded, reducedMotion, turn]);

  const label = expanded ? 'Show fewer' : `Show ${hiddenCount} more`;
  const rotate = useMemo(() => turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }), [turn]);

  return (
    <Pressable
      {...hook}
      testID={testID}
      role="button"
      accessibilityLabel={label}
      aria-expanded={expanded}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        {
          position: 'absolute',
          left: '50%',
          marginLeft: -20,
          bottom: expanded ? -8 : 4,
          width: 40,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: borderRadius.full,
          borderWidth: 1,
          borderColor: palette.pill.border,
          backgroundColor: hovered ? palette.pill.hover : palette.pill.background,
          boxShadow: palette.pill.shadow,
        },
        colorEase,
        ring,
      ]}>
      <Animated.View style={{ width: 14, height: 14, transform: [{ rotate }] }}>
        <RiArrowDownSLine width={14} height={14} fill={palette.textSecondary} />
      </Animated.View>
    </Pressable>
  );
}
