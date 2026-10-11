import React, { memo, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { violetBase } from '../chart-cards/ai-profile-hues';
import { ContributionsGrid } from '../chart-cards/ContributionsCard';
import { TABULAR } from '../chart-cards/primitives/ChartHeader';
import { groupThousands } from '../chart-cards/primitives/format';
import { useCountUp } from '../chart-cards/use-count-up';
import { Chip } from '../chip';
import { CoverHeader } from '../cover-header';
import { useControllableState } from '../hooks/use-controllable-state';
import { useMessages } from '../locale/messages';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { BREAKPOINTS } from '../styles/breakpoints';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AI_PROFILE_CARD_MESSAGES } from './messages';
import type { AiProfileCardPeriod, AiProfileCardProps } from './types';
import { formatCurrency } from '../locale/format-number';

/**
 * An AI profile card: a cover photo, an overlapping avatar, name and handle,
 * a count-up contributions headline, stat tiles and the contributions
 * heatmap.
 *
 *   card      radius 24, 1px borderLight, no
 *             fill, clips its children
 *   cover     absolute over the top 165px, top corners 23, background-tertiary
 *             under the photo, `object-position: 50% 45%` — a `CoverHeader`
 *   content   column 15 apart, padding 124 top / 16 sides / 16 bottom
 *   avatar    80 disc, background-tertiary, initials 30 / 42.5 medium
 *             text-secondary — overlapping the cover's bottom edge by 41
 *   name row  name title-2-medium; 4 under it the handle headline-medium
 *             text-secondary and the neutral badge, 6 apart. `actions` hang
 *             34 above the row, 4 in from its right edge, 10 apart
 *   block     8 apart: label body-medium text-secondary / 2 / headline
 *             title-1-medium tabular + a status-purple chip 8 after it;
 *             tiles radius 10, padding 10, background-secondary, value
 *             body-medium over label body-2-medium text-secondary, both
 *             truncating — one row of equal tiles from 640px, two columns below;
 *             the Activity row (6 top, 2 left) with body-2-medium label and a
 *             plain segmented switcher; the heatmap (38 columns, violet) — 13px
 *             cells in a horizontal scroller below 640px
 *
 * Surfaces and text follow canonical theme roles; the delta chip uses the
 * support pair. The contributions heatmap retains its data hue.
 */

const COVER_HEIGHT = 165;
const AVATAR_SIZE = 80;
/** Where the content starts: the avatar overlaps the cover's bottom edge by 41. */
const CONTENT_TOP = 124;

/**
 * The count-up headline, in its own component: the roll re-renders every frame
 * for 1.6s, and must not take the heatmap's ~270 cells with it.
 */
function RollingHeadline({
  value,
  duration,
  format,
  color,
  testID,
}: {
  value: number;
  duration: number;
  format: (value: number) => string;
  color: string;
  testID?: string;
}) {
  // Counts up 0 → the total on mount: the target flips after the first render
  // so the roll has 0 to start from.
  const [target, setTarget] = useState(duration > 0 ? 0 : value);
  useEffect(() => setTarget(value), [value]);
  const rolled = useCountUp(target, Math.max(1, duration));
  return (
    <Text variant="title-1-medium" numberOfLines={1} testID={testID} style={[{ color }, TABULAR]}>
      {format(rolled)}
    </Text>
  );
}

function AiProfileCardComponent({
  name,
  handle,
  badge,
  coverSource,
  coverPosition = { x: 0.5, y: 0.45 },
  avatarSource,
  initials,
  actions,
  contributionsLabel: contributionsLabelProp,
  contributions,
  format: formatProp,
  countUpDuration = 1600,
  delta,
  stats,
  activityLabel: activityLabelProp,
  periods: periodsProp,
  period,
  defaultPeriod,
  onPeriodChange,
  cells,
  columns = 38,
  color,
  animateIn = true,
  activeCell,
  onActiveCellChange,
  style,
  testID,
}: AiProfileCardProps) {
  const { locale, messages } = useMessages(AI_PROFILE_CARD_MESSAGES);
  const format = formatProp ?? ((value: number) => formatCurrency(value, 'USD', locale));
  const contributionsLabel = contributionsLabelProp ?? messages.contributions;
  const activityLabel = activityLabelProp ?? messages.activity;
  const defaultPeriods = useMemo<readonly AiProfileCardPeriod[]>(
    () => [
      { id: 'weekly', label: messages.periods.weekly },
      { id: 'monthly', label: messages.periods.monthly },
      { id: 'yearly', label: messages.periods.yearly },
    ],
    [messages],
  );
  const periods = periodsProp ?? defaultPeriods;
  const theme = useTheme();
  const { width: viewport } = useWindowDimensions();
  const wide = viewport >= BREAKPOINTS.sm;

  const colors = useMemo(() => {
    const c = theme.colors;
    return {
      border: c.borderLight,
      tertiary: c.backgroundTertiary,
      secondary: c.backgroundSecondary,
      text: theme.colors.text,
      textSecondary: c.textSecondary,
      chip: { background: c.secondarySubtle, foreground: c.secondarySubtleForeground },
      grid: color ?? violetBase(theme),
    };
  }, [theme, color]);

  const [selectedPeriod, setPeriod] = useControllableState<string>({
    value: period,
    defaultValue: defaultPeriod ?? periods[0]?.id ?? '',
    onChange: onPeriodChange,
  });

  const letters = initials ?? name.trim().charAt(0).toUpperCase();

  const grid = useMemo(
    () => (
      <ContributionsGrid
        cells={cells}
        columns={columns}
        color={colors.grid}
        animateIn={animateIn}
        compact={!wide}
        activeCell={activeCell}
        onActiveCellChange={onActiveCellChange}
        testID={testID ? `${testID}-grid` : undefined}
      />
    ),
    [cells, columns, colors.grid, animateIn, wide, activeCell, onActiveCellChange, testID],
  );

  return (
    <CoverHeader
      testID={testID}
      coverSource={coverSource}
      coverPosition={coverPosition}
      coverHeight={COVER_HEIGHT}
      overlap={COVER_HEIGHT - CONTENT_TOP}
      style={[
        {
          minWidth: 0,
          overflow: 'hidden',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      coverStyle={{ borderTopLeftRadius: 23, borderTopRightRadius: 23 }}
      contentStyle={{
        flexDirection: 'column',
        gap: 15,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <Avatar
        testID={testID ? `${testID}-avatar` : undefined}
        size={AVATAR_SIZE}
        source={avatarSource ?? undefined}
        initials={letters}
        color="neutral"
        alt={avatarSource ? name : undefined}
        placeholderColor={colors.tertiary}
        placeholderIcon={
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.initials, { color: colors.textSecondary }]}
          >
            {letters}
          </Text>
        }
      />

      <View
        style={{
          position: 'relative',
          width: '100%',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 15,
        }}
      >
        <View style={{ minWidth: 0, flex: 1, flexDirection: 'column', gap: 4 }}>
          <Text variant="title-2-medium" numberOfLines={1} style={{ color: colors.text }}>
            {name}
          </Text>
          {handle != null || badge != null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {handle != null ? (
                <Text
                  variant="headline-medium"
                  numberOfLines={1}
                  style={{ color: colors.textSecondary }}
                >
                  {handle}
                </Text>
              ) : null}
              {badge != null ? (
                <Badge
                  testID={testID ? `${testID}-badge` : undefined}
                  content={badge}
                  style={{ backgroundColor: colors.tertiary }}
                  textStyle={{ color: colors.textSecondary }}
                />
              ) : null}
            </View>
          ) : null}
        </View>
        {actions ? (
          <View
            testID={testID ? `${testID}-actions` : undefined}
            style={{
              position: 'absolute',
              top: -34,
              right: 4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            {actions}
          </View>
        ) : null}
      </View>

      <View style={{ width: '100%', flexDirection: 'column', gap: 8 }}>
        <View style={{ flexDirection: 'column', gap: 2 }}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: colors.textSecondary }}>
            {contributionsLabel}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RollingHeadline
              value={contributions}
              duration={countUpDuration}
              format={format}
              color={colors.text}
              testID={testID ? `${testID}-headline` : undefined}
            />
            {delta != null ? (
              <Chip
                size="md"
                testID={testID ? `${testID}-delta` : undefined}
                style={{ alignSelf: 'center', backgroundColor: colors.chip.background }}
                textStyle={{ color: colors.chip.foreground }}
              >
                {delta}
              </Chip>
            ) : null}
          </View>
        </View>

        {stats && stats.length > 0 ? (
          <View
            testID={testID ? `${testID}-stats` : undefined}
            style={{ flexDirection: 'column', gap: 8 }}
          >
            {(wide ? [stats.map((_, i) => i)] : pairs(stats.length)).map((row) => (
              <View key={row[0]} style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
                {row.map((i) => {
                  const stat = stats[i]!;
                  return (
                    <View
                      key={`${i}-${stat.label}`}
                      testID={testID ? `${testID}-stat-${i}` : undefined}
                      style={[styles.tile, { backgroundColor: colors.secondary }]}
                    >
                      <Text
                        variant="body-medium"
                        numberOfLines={1}
                        style={{ width: '100%', color: colors.text }}
                      >
                        {stat.value}
                      </Text>
                      <Text
                        variant="body-2-medium"
                        numberOfLines={1}
                        style={{ width: '100%', color: colors.textSecondary }}
                      >
                        {stat.label}
                      </Text>
                    </View>
                  );
                })}
                {/* An odd tile keeps its half of the two-column grid. */}
                {!wide && row.length === 1 ? <View style={styles.tileSpacer} /> : null}
              </View>
            ))}
          </View>
        ) : null}

        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 6,
            paddingLeft: 2,
          }}
        >
          <Text variant="body-2-medium" style={{ color: colors.textSecondary }}>
            {activityLabel}
          </Text>
          {periods.length > 0 ? (
            <SegmentedControl
              label={messages.periodGroup(activityLabel)}
              type="radio"
              variant="plain"
              value={selectedPeriod}
              onValueChange={setPeriod}
            >
              {periods.map((p) => (
                <SegmentedControlItem
                  key={p.id}
                  value={p.id}
                  testID={testID ? `${testID}-period-${p.id}` : undefined}
                >
                  <SegmentedControlItemText>{p.label}</SegmentedControlItemText>
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          ) : null}
        </View>

        {wide ? (
          grid
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {grid}
          </ScrollView>
        )}
      </View>
    </CoverHeader>
  );
}

function pairs(count: number): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < count; i += 2) rows.push(i + 1 < count ? [i, i + 1] : [i]);
  return rows;
}

export const AiProfileCard = memo(AiProfileCardComponent);
AiProfileCard.displayName = 'AiProfileCard';

const styles = StyleSheet.create({
  initials: {
    fontSize: 30,
    lineHeight: 42.5,
    fontWeight: '500',
    letterSpacing: 0,
    textAlign: 'center',
  },
  tile: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  tileSpacer: { flex: 1, flexBasis: 0, minWidth: 0 },
});
