import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Chip } from '../chip';
import { RiArrowDownCircleFill } from '../icons/remix/RiArrowDownCircleFill';
import { RiArrowUpCircleFill } from '../icons/remix/RiArrowUpCircleFill';
import { RiIndeterminateCircleFill } from '../icons/remix/RiIndeterminateCircleFill';
import { RiInformationFill } from '../icons/remix/RiInformationFill';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveDashboardSurfaces, statusPair, toneColor, type DashboardSurfaces } from './tones';
import type {
  StatCardProps,
  StatCardsDeltaColor,
  StatCardsItem,
  StatCardsProps,
  StatCardsTone,
} from './types';

/**
 * KPI stat cards. Geometry, to the pixel:
 *
 *   plain    radius 16, padding 16, 132 tall, space-between
 *            icon tile: radius 6, padding 6, icon 20
 *            label 14/20 medium → 2 → value 24/34 medium + 8 + chip (wraps)
 *
 *   footer   radius 16, padding 8
 *            header: padding 8, gradient tile 40 radius 10 + icon 20 white,
 *                    info glyph 20 (tooltip on hover, focus AND press)
 *            body:   padding 10 top / 8 sides / 14 bottom,
 *                    label 14/20 medium (truncates) → 2 → value 32/44 medium tabular
 *            band:   radius 10, padding 6 / 6 right / 10 left, `shadow-card`,
 *                    caption 14/20 regular + delta pill (padding 2 / 8 right /
 *                    4 left, icon 16, gap 4, 14/20 medium tabular, full radius)
 *
 * Grid gap 16. Columns follow the WINDOW (Tailwind breakpoints), so
 * this reads `useWindowDimensions`, and rows stretch their cards to one height
 * the way CSS grid rows do.
 */

const IS_WEB = Platform.OS === 'web';

/** Tailwind `sm` / `lg` / `xl`. */
const BREAKPOINT_SM = 640;
const BREAKPOINT_LG = 1024;
const BREAKPOINT_XL = 1280;

const GRID_GAP = 16;
const TOOLTIP_DELAY_MS = 200;

// ---------------------------------------------------------------------------
//  Web: the info glyph's hover colour transition and keyboard ring. It is a
//  react-native-web `Pressable`, so the hook is a `data-*` attribute, and the
//  sheet is adopted (CSP), never a `<style>`.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-stat-cards-web-css';
const HINT_SELECTOR = '[data-bloom-stat-hint]';
const STAT_CARDS_CSS = `${HINT_SELECTOR} { cursor: pointer; outline: none; border-radius: 9999px; }
${HINT_SELECTOR} path { transition: fill 150ms ease; }
${HINT_SELECTOR}:focus-visible { box-shadow: 0 0 0 2px var(--bloom-stat-hint-ring, currentColor); }`;

type WebDataSet = { dataSet?: Record<string, string> };

/** Gradient stops of the footer tile: `from-<tone>-500 to-<tone>-600` (orange and sky one stop lighter). */
function tileGradient(theme: Theme, tone: StatCardsTone): readonly [string, string] {
  if (tone === 'orange' || tone === 'sky') {
    return [toneColor(theme, tone, 400), toneColor(theme, tone, 500)];
  }
  return [toneColor(theme, tone, 500), toneColor(theme, tone, 600)];
}

const DELTA_ICONS = {
  lime: RiArrowUpCircleFill,
  rose: RiArrowDownCircleFill,
  neutral: RiIndeterminateCircleFill,
} as const;

/** Delta colours onto Bloom's `Chip` tones. */
const CHIP_TONES = { lime: 'success', rose: 'danger', neutral: 'neutral' } as const;

let gradientIdCounter = 0;

function GradientTile({ colors, children }: { colors: readonly [string, string]; children: React.ReactNode }) {
  const id = useMemo(() => `bloom-stat-tile${gradientIdCounter++}`, []);
  return (
    <View style={styles.tile}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            {/* Opaque stops only: react-native-svg drops alpha in `stopColor`. */}
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {/* A View, so it stacks over the absolutely-positioned gradient on web too. */}
      <View style={styles.tileGlyph}>{children}</View>
    </View>
  );
}

function DeltaPill({
  delta,
  deltaColor,
  surfaces,
  surface,
  testID,
}: {
  delta: string;
  deltaColor: StatCardsDeltaColor;
  surfaces: DashboardSurfaces;
  /** The containing surface, retained for the shared status-pair call. */
  surface: string;
  testID?: string;
}) {
  const theme = useTheme();
  const paint =
    deltaColor === 'neutral'
      ? { background: surfaces.secondary, foreground: surfaces.textSecondary }
      : statusPair(theme, deltaColor, surface);
  const Icon = DELTA_ICONS[deltaColor];
  return (
    <View testID={testID} style={[styles.pill, { backgroundColor: paint.background }]}>
      <Icon width={16} height={16} fill={paint.foreground} />
      <Text
        variant="body-medium"
        numberOfLines={1}
        style={[styles.tabular, { color: paint.foreground }]}
      >
        {delta}
      </Text>
    </View>
  );
}

function StatHint({
  label,
  hint,
  surfaces,
  testID,
}: {
  label: string;
  hint: string;
  surfaces: DashboardSurfaces;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<View>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => clearTimer, [clearTimer]);

  // Web: the open tooltip mounts a full-page dismiss layer OVER the trigger, so
  // the trigger reports a hover-out the moment the bubble appears — with the
  // pointer still on the glyph. While hovered and open, the pointer's position
  // against the glyph's box decides instead.
  useEffect(() => {
    if (!IS_WEB || !hovered || typeof document === 'undefined') return;
    const onMove = (event: PointerEvent) => {
      const node = triggerRef.current as unknown as HTMLElement | null;
      if (!node || typeof node.getBoundingClientRect !== 'function') return;
      const r = node.getBoundingClientRect();
      const inside =
        event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) {
        clearTimer();
        setHovered(false);
        setOpen(false);
      }
    };
    document.addEventListener('pointermove', onMove);
    return () => document.removeEventListener('pointermove', onMove);
  }, [hovered, clearTimer]);

  const dataSet: WebDataSet = IS_WEB ? { dataSet: { bloomStatHint: '' } } : {};
  const hintStyle: WebCssStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    // The `:focus-visible` ring colour, read by the adopted sheet.
    '--bloom-stat-hint-ring': surfaces.focusRing,
  };

  return (
    <Tooltip position="top" visible={open} onVisibleChange={setOpen}>
      <TooltipTrigger>
        <Pressable
          ref={triggerRef}
          {...dataSet}
          testID={testID}
          role="button"
          accessibilityLabel={label}
          hitSlop={8}
          onHoverIn={() => {
            setHovered(true);
            clearTimer();
            timer.current = setTimeout(() => setOpen(true), TOOLTIP_DELAY_MS);
          }}
          onHoverOut={() => {
            // On web the pointer listener above owns leaving (see there).
            if (IS_WEB) return;
            setHovered(false);
            clearTimer();
            setOpen(false);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onPress={() => {
            clearTimer();
            setOpen((value) => !value);
          }}
          style={hintStyle}
        >
          <RiInformationFill
            width={20}
            height={20}
            fill={hovered ? surfaces.text : surfaces.iconSecondary}
          />
        </Pressable>
      </TooltipTrigger>
      <TooltipTextBubble size="md">{hint}</TooltipTextBubble>
    </Tooltip>
  );
}

function StatCardComponent({ stat, variant = 'plain', style, testID }: StatCardProps) {
  const theme = useTheme();
  const surfaces = useMemo(() => resolveDashboardSurfaces(theme), [theme]);

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, STAT_CARDS_CSS);
  }, []);

  const Icon = stat.icon;

  if (variant === 'footer') {
    const gradient = tileGradient(theme, stat.tone ?? 'blue');
    return (
      <View
        testID={testID}
        style={[styles.footerCard, { backgroundColor: surfaces.secondary }, style]}
      >
        <View style={styles.footerHeader}>
          <GradientTile colors={gradient}>
            <Icon width={20} height={20} fill="#fff" />
          </GradientTile>
          {stat.hint ? (
            <StatHint
              label={stat.hintLabel ?? `About ${stat.label}`}
              hint={stat.hint}
              surfaces={surfaces}
              testID={testID ? `${testID}-hint` : undefined}
            />
          ) : null}
        </View>

        <View style={styles.footerBody}>
          <Text
            variant="body-medium"
            numberOfLines={1}
            style={{ color: surfaces.textSecondary }}
          >
            {stat.label}
          </Text>
          <Text
            variant="display-4-medium"
            numberOfLines={1}
            style={[styles.tabular, { color: surfaces.text }]}
          >
            {stat.value}
          </Text>
        </View>

        <View
          testID={testID ? `${testID}-band` : undefined}
          style={[
            styles.band,
            { backgroundColor: surfaces.inner, boxShadow: surfaces.cardShadow },
          ]}
        >
          <Text
            variant="body-regular"
            numberOfLines={1}
            style={[styles.caption, { color: surfaces.textSecondary }]}
          >
            {stat.caption ?? 'From last month'}
          </Text>
          <DeltaPill
            delta={stat.delta}
            deltaColor={stat.deltaColor}
            surfaces={surfaces}
            surface={surfaces.inner}
            testID={testID ? `${testID}-delta` : undefined}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[styles.plainCard, { backgroundColor: surfaces.secondary }, style]}
    >
      <View style={[styles.iconTile, { backgroundColor: surfaces.iconTile }]}>
        <Icon width={20} height={20} fill={surfaces.text} />
      </View>
      <View style={styles.plainBody}>
        <Text variant="body-medium" style={{ color: surfaces.textSecondary }}>
          {stat.label}
        </Text>
        <View style={styles.valueRow}>
          <Text variant="title-1-medium" numberOfLines={1} style={{ color: surfaces.text }}>
            {stat.value}
          </Text>
          <Chip
            size="md"
            appearance="subtle"
            tone={CHIP_TONES[stat.deltaColor]}
            // `Chip` pins itself to `flex-start`; the row centres it on the value.
            style={styles.chip}
            testID={testID ? `${testID}-delta` : undefined}
          >
            {stat.delta}
          </Chip>
        </View>
      </View>
    </View>
  );
}

export const StatCard = memo(StatCardComponent);
StatCard.displayName = 'StatCard';

/** The responsive column count for one variant at one window width. */
export function statCardsColumnCount(
  variant: StatCardProps['variant'],
  columns: StatCardsProps['columns'],
  windowWidth: number,
): number {
  if (columns === 1) return 1;
  if (variant === 'footer') {
    if (columns === 4 && windowWidth >= BREAKPOINT_XL) return 4;
    return windowWidth >= BREAKPOINT_SM ? 2 : 1;
  }
  if (columns === 4 && windowWidth >= BREAKPOINT_LG) return 4;
  return 2;
}

function StatCardsComponent({
  stats,
  variant = 'plain',
  count,
  columns = 4,
  style,
  testID,
}: StatCardsProps) {
  const { width } = useWindowDimensions();
  const perRow = statCardsColumnCount(variant, columns, width);
  const items = stats.slice(0, count ?? stats.length);

  const rows: StatCardsItem[][] = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));

  return (
    <View testID={testID} style={[styles.grid, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((stat, index) => (
            <StatCard
              key={`${stat.label}-${index}`}
              stat={stat}
              variant={variant}
              style={styles.gridCell}
              testID={testID ? `${testID}-${rowIndex * perRow + index}` : undefined}
            />
          ))}
          {/* Empty tracks keep a short last row on the grid's columns. */}
          {Array.from({ length: perRow - row.length }, (_, i) => (
            <View key={`empty-${i}`} style={styles.gridCell} />
          ))}
        </View>
      ))}
    </View>
  );
}

export const StatCards = memo(StatCardsComponent);
StatCards.displayName = 'StatCards';

const styles = StyleSheet.create({
  grid: { width: '100%', gap: GRID_GAP },
  gridRow: { flexDirection: 'row', alignItems: 'stretch', gap: GRID_GAP },
  gridCell: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  plainCard: {
    height: 132,
    minWidth: 0,
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconTile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 6,
  },
  plainBody: { width: '100%', gap: 2 },
  valueRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  footerCard: {
    minWidth: 0,
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
  },
  footerHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
  },
  tile: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileGlyph: { width: 20, height: 20 },
  footerBody: {
    gap: 2,
    paddingTop: 10,
    paddingBottom: 14,
    paddingLeft: 8,
    paddingRight: 8,
  },
  band: {
    marginTop: 'auto',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 10,
    paddingTop: 6,
    paddingBottom: 6,
    paddingRight: 6,
    paddingLeft: 10,
  },
  chip: { alignSelf: 'center' },
  caption: { flexShrink: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    borderRadius: 9999,
    paddingTop: 2,
    paddingBottom: 2,
    paddingRight: 8,
    paddingLeft: 4,
  },
  tabular: { fontVariant: ['tabular-nums'] },
});
