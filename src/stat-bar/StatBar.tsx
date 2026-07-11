import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { StatBarProps } from './types';

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * A horizontal labeled value bar with two variants:
 *
 * - `progress` — a rounded capsule track with a proportional `value / max`
 *   fill, an optional top-right `icon`, and an optional min/max footer row.
 * - `split` — a capsule split at `percent` (left portion active, remainder the
 *   track color), a bold percentage right of the label, and a two-sided footer
 *   of opposing values (inflow/outflow style).
 *
 * Colors come from the theme (the same NativeWind token pipeline that backs the
 * `--*` vars) — text via `text`/`textSecondary`/`textTertiary`, the track from
 * `backgroundSecondary` — with the fill overridable per-prop. Pure `<View>`
 * composition, so it renders identically on web and native.
 */
const StatBarComponent: React.FC<StatBarProps> = (props) => {
  const { colors } = useTheme();
  const { label, fillColor, trackColor, height = 6, icon, style, testID } = props;
  const fill = fillColor ?? colors.primary;
  const track = trackColor ?? colors.backgroundSecondary;
  const radius = height / 2;

  if (props.variant === 'split') {
    const { percent, leftValue, rightValue, leftColor, rightColor } = props;
    const leftPercent = clampPercent(percent);
    const activeLeft = leftColor ?? fill;
    const remainder = rightColor ?? track;

    return (
      <View style={[styles.wrap, style]} testID={testID}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[styles.percent, { color: colors.text }]} numberOfLines={1}>
            {Math.round(leftPercent)}%
          </Text>
        </View>

        <View style={[styles.track, { height, borderRadius: radius, backgroundColor: remainder }]}>
          <View
            style={{ width: `${leftPercent}%`, height, borderRadius: radius, backgroundColor: activeLeft }}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerValue, { color: colors.textTertiary }]} numberOfLines={1}>
            {leftValue}
          </Text>
          <Text style={[styles.footerValue, { color: colors.textTertiary }]} numberOfLines={1}>
            {rightValue}
          </Text>
        </View>
      </View>
    );
  }

  const { value, max, minLabel, maxLabel } = props;
  const ratio = max > 0 ? clampPercent((value / max) * 100) : 0;
  const hasFooter = minLabel != null || maxLabel != null;

  return (
    <View style={[styles.wrap, style]} testID={testID}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
        {icon != null && <View style={styles.icon}>{icon}</View>}
      </View>

      <View
        style={[styles.track, { height, borderRadius: radius, backgroundColor: track }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max, now: value }}
      >
        <View style={{ width: `${ratio}%`, height, borderRadius: radius, backgroundColor: fill }} />
      </View>

      {hasFooter && (
        <View style={styles.footerRow}>
          <Text style={[styles.footerValue, { color: colors.textTertiary }]} numberOfLines={1}>
            {minLabel ?? ''}
          </Text>
          <Text style={[styles.footerValue, { color: colors.textTertiary }]} numberOfLines={1}>
            {maxLabel ?? ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: { flexShrink: 1, fontSize: 13, fontWeight: '500' },
  percent: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2, fontVariant: ['tabular-nums'] },
  icon: { marginLeft: 8 },
  track: { width: '100%', overflow: 'hidden', flexDirection: 'row', borderCurve: 'continuous' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  footerValue: { fontSize: 12, fontVariant: ['tabular-nums'] },
});

export const StatBar = memo(StatBarComponent);
StatBar.displayName = 'StatBar';
