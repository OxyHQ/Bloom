import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { CompositionBarProps } from './types';

const BAR_HEIGHT = 44;
/** Fully-rounded capsule ends. */
const RADIUS_FULL = BAR_HEIGHT / 2;
/** Slight inner-corner rounding so segments read as one bar, not buttons. */
const RADIUS_INNER = 8;
/** Floor so a tiny category stays tappable/visible; flexbox renormalizes the rest. */
const MIN_SEGMENT_WIDTH = 18;

function defaultFormatReadout(points: number, percent: number): string {
  return `${points} pts · ${percent}%`;
}

/**
 * The distribution bar — the signature composition visual. A single thick
 * capsule split into one colored block per category, each block's width
 * proportional to that category's share of the total (never a progress bar —
 * the segments always fill the full width). The first/last blocks carry the
 * rounded capsule ends; inner blocks are only slightly rounded and separated by
 * a hairline-thin background gap so they read as ONE bar. Tapping a block
 * selects it (dimming the rest) and reveals a readout of its name, points, and
 * percentage; selection is lifted so the matching list row highlights in sync.
 */
const CompositionBarComponent: React.FC<CompositionBarProps> = ({
  categories,
  selectedKey,
  onSelect,
  hintLabel,
  formatReadout = defaultFormatReadout,
  style,
  testID,
}) => {
  const { colors } = useTheme();

  const positive = useMemo(
    () => categories.filter((category) => category.amount > 0),
    [categories],
  );
  const total = useMemo(
    () => positive.reduce((sum, category) => sum + category.amount, 0),
    [positive],
  );
  const selected = useMemo(
    () => (selectedKey ? positive.find((category) => category.key === selectedKey) ?? null : null),
    [positive, selectedKey],
  );

  if (total <= 0) {
    return (
      <View
        style={[styles.emptyTrack, { backgroundColor: colors.backgroundSecondary }, style]}
        testID={testID}
      />
    );
  }

  const selectedPercent = selected ? Math.round((selected.amount / total) * 100) : 0;

  return (
    <View style={[styles.wrap, style]} testID={testID}>
      <View style={styles.bar}>
        {positive.map((category, index) => {
          const isFirst = index === 0;
          const isLast = index === positive.length - 1;
          const dim = selected != null && category.key !== selectedKey;
          return (
            <Pressable
              key={category.key}
              onPress={() => onSelect(category.key)}
              accessibilityRole="button"
              accessibilityLabel={category.name}
              accessibilityState={{ selected: category.key === selectedKey }}
              style={[
                styles.segment,
                {
                  flexGrow: category.amount,
                  backgroundColor: category.color,
                  opacity: dim ? 0.35 : 1,
                  borderTopLeftRadius: isFirst ? RADIUS_FULL : RADIUS_INNER,
                  borderBottomLeftRadius: isFirst ? RADIUS_FULL : RADIUS_INNER,
                  borderTopRightRadius: isLast ? RADIUS_FULL : RADIUS_INNER,
                  borderBottomRightRadius: isLast ? RADIUS_FULL : RADIUS_INNER,
                },
              ]}
            />
          );
        })}
      </View>

      {selected ? (
        <View style={styles.readout}>
          <View style={[styles.readoutDot, { backgroundColor: selected.color }]} />
          <Text style={[styles.readoutName, { color: colors.text }]} numberOfLines={1}>
            {selected.name}
          </Text>
          <Text style={[styles.readoutMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {formatReadout(selected.amount, selectedPercent)}
          </Text>
        </View>
      ) : (
        <Text style={[styles.hint, { color: colors.textSecondary }]} numberOfLines={1}>
          {hintLabel}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  bar: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    gap: 3,
  },
  segment: {
    flexBasis: 0,
    minWidth: MIN_SEGMENT_WIDTH,
    height: BAR_HEIGHT,
    borderCurve: 'continuous',
  },
  emptyTrack: {
    height: BAR_HEIGHT,
    borderRadius: RADIUS_FULL,
    borderCurve: 'continuous',
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readoutDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  readoutName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  readoutMeta: {
    flexShrink: 1,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 13,
  },
});

export const CompositionBar = memo(CompositionBarComponent);
CompositionBar.displayName = 'CompositionBar';
