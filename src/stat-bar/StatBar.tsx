import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { clamp } from '../styles/clamp';
import { Text } from '../typography';
import { Meter } from './Meter';
import type { StatBarProps } from './types';

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0;
  return clamp(value, 0, 100);
}

/**
 * A LABELLED bar — `Meter` plus the text around it — in two variants:
 *
 * - `progress` — a rounded capsule track with a proportional `value / max`
 *   fill, an optional top-right `icon`, and an optional min/max footer row.
 * - `split` — a capsule split at `percent` (left portion active, remainder the
 *   track color), a bold percentage right of the label, and a two-sided footer
 *   of opposing values (inflow/outflow style).
 *
 * The bar itself is `Meter`, so the geometry, the default colours and the
 * `progressbar` accessibility are the same ones every other bar in Bloom uses.
 * This family owns only the label row and the footer. Text comes from the theme
 * (`text`/`textSecondary`/`textTertiary`); the fill and the track default to
 * `resolveMeterColors` (the accent over `neutral-200` / dark `neutral-700`) and
 * stay overridable per-prop. Pure `<View>` composition, so it renders
 * identically on web and native.
 */
const StatBarComponent: React.FC<StatBarProps> = (props) => {
  const { colors } = useTheme();
  const { label, fillColor, trackColor, height = 6, icon, style, testID } = props;
  const radius = height / 2;

  if (props.variant === 'split') {
    const { percent, leftValue, rightValue, leftColor, rightColor } = props;
    const leftPercent = clampPercent(percent);

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

        <Meter
          value={leftPercent}
          max={100}
          height={height}
          radius={radius}
          fill={leftColor ?? fillColor}
          track={rightColor ?? trackColor}
          accessibilityLabel={label}
          valueText={`${Math.round(leftPercent)}%`}
          style={styles.track}
        />

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
  const hasFooter = minLabel != null || maxLabel != null;

  return (
    <View style={[styles.wrap, style]} testID={testID}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
        {icon != null && <View style={styles.icon}>{icon}</View>}
      </View>

      <Meter
        value={value}
        max={max}
        height={height}
        radius={radius}
        fill={fillColor}
        track={trackColor}
        accessibilityLabel={label}
        style={styles.track}
      />

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
  track: { width: '100%', flexDirection: 'row', borderCurve: 'continuous' },
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
